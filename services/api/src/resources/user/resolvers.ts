import * as R from 'ramda';
import { query, isPatchEmpty } from '../../util/db';
import Sql from './sql';

export const getUserBySshKey = async (
  _root,
  { sshKey },
  { sqlClient, models, hasPermission },
) => {
  await hasPermission('user', 'getBySshKey');

  const [keyType, keyValue] = R.compose(
    R.split(' '),
    R.defaultTo(''),
    // @ts-ignore
  )(sshKey);

  const rows = await query(
    sqlClient,
    Sql.selectUserIdBySshKey({ keyType, keyValue }),
  );
  const userId = R.map(R.prop('usid'), rows);

  const user = await models.UserModel.loadUserById(userId);

  return user;
};

export const addUser = async (
  _root,
  { input },
  { models, hasPermission },
) => {
  await hasPermission('user', 'add');

  const user = await models.UserModel.addUser({
    email: input.email,
    username: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    comment: input.comment,
    gitlabId: input.gitlabId,
  });

  return user;
};

export const updateUser = async (
  _root,
  { input: { user: userInput, patch } },
  { models, hasPermission },
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  await hasPermission('user', 'update', {
    users: [user.id],
  });

  const updatedUser = await models.UserModel.updateUser({
    id: user.id,
    email: patch.email,
    username: patch.email,
    firstName: patch.firstName,
    lastName: patch.lastName,
    comment: patch.comment,
    gitlabId: patch.gitlabId,
  });

  return updatedUser;
};

export const deleteUser = async (
  _root,
  { input: { user: userInput } },
  { models, hasPermission },
) => {
  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  await hasPermission('user', 'delete', {
    users: [user.id],
  });

  await models.UserModel.deleteUser(user.id);

  // TODO remove user ssh keys

  return 'success';
};

export const deleteAllUsers = async (
  _root,
  _args,
  { models, hasPermission },
) => {
  await hasPermission('user', 'deleteAll');

  const users = await models.UserModel.loadAllUsers();
  const userIds = R.pluck('id', users);

  const deleteUsers = userIds.map(
    async id => await models.UserModel.deleteUser(id),
  );

  try {
    // Deleting all users in parallel may cause problems, but this is only used
    // in the tests right now and the number of users for that use case is low.
    await Promise.all(deleteUsers);
  } catch (err) {
    throw new Error(`Could not delete all users: ${err.message}`);
  }

  return 'success';
};
