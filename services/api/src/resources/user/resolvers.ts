import * as R from 'ramda';
import { query, isPatchEmpty } from '../../util/db';
import Sql from './sql';

export const getUserBySshKey = async (
  _root,
  { sshKey },
  { sqlClient, dataSources, hasPermission },
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

  const user = await dataSources.UserModel.loadUserById(userId);

  return user;
};

export const addUser = async (
  _root,
  { input },
  { dataSources, hasPermission },
) => {
  await hasPermission('user', 'add');

  const user = await dataSources.UserModel.addUser({
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
  { dataSources, hasPermission },
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const user = await dataSources.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  await hasPermission('user', 'update', {
    users: [user.id],
  });

  const updatedUser = await dataSources.UserModel.updateUser({
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
  { dataSources, hasPermission },
) => {
  const user = await dataSources.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  await hasPermission('user', 'delete', {
    users: [user.id],
  });

  await dataSources.UserModel.deleteUser(user.id);

  // TODO remove user ssh keys

  return 'success';
};

export const deleteAllUsers = async (
  _root,
  _args,
  { dataSources, hasPermission },
) => {
  await hasPermission('user', 'deleteAll');

  const users = await dataSources.UserModel.loadAllUsers();
  const userIds = R.pluck('id', users);

  const deleteUsers = userIds.map(
    async id => await dataSources.UserModel.deleteUser(id),
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
