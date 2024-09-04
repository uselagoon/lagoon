import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty } from '../../util/db';
import { Helpers as organizationHelpers } from '../organization/helpers';
import { Sql } from './sql';

export const getMe: ResolverFn = async (_root, args, { models, keycloakGrant: grant }) => {
  const currentUserId: string = grant.access_token.content.sub;
  return models.UserModel.loadUserById(currentUserId);
}

class SearchInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchInputError';
  }
}

class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}


export const getUserBySshKey: ResolverFn = async (
  _root,
  { sshKey },
  { sqlClientPool, models, hasPermission },
) => {
  await hasPermission('user', 'getBySshKey');

  const [keyType, keyValue] = R.compose(
    R.split(' '),
    R.defaultTo(''),
    // @ts-ignore
  )(sshKey);

  if(!keyType || !keyValue) {
    throw new SearchInputError("Malformed ssh key provided. Should begin with key-type (eg. ssh-rsa|ssh-ed25519|etc.), then a space, then the key's value");
  }

  const rows = await query(
    sqlClientPool,
    Sql.selectUserIdBySshKey({ keyType, keyValue }),
  );
  const userId = R.map(R.prop('usid'), rows);

  const user = await models.UserModel.loadUserById(userId[0]);

  return user;
};

export const getUserBySshFingerprint: ResolverFn = async (
  _root,
  { fingerprint },
  { sqlClientPool, models, hasPermission },
) => {
  await hasPermission('user', 'getBySshKey');

  if(!fingerprint) {
    throw new SearchInputError("Malformed ssh key fingerprint provided");
  }
  try {
    const rows = await query(
      sqlClientPool,
      Sql.selectUserIdBySshFingerprint({keyFingerprint: fingerprint}),
    );
    const userId = R.map(R.prop('usid'), rows);
    const user = await models.UserModel.loadUserById(userId[0]);
    return user;
  } catch (err) {
    throw new UserNotFoundError("No user found matching provided fingerprint");
  }
};

// query to get all users, with some inputs to limit the search to specific email, id, or gitlabId
export const getAllUsers: ResolverFn = async (
  _root,
  { id, email, gitlabId },
  { sqlClientPool, models, hasPermission },
) => {
  await hasPermission('user', 'viewAll');

  const users = await models.UserModel.loadAllUsers();
  if (id) {
    const filteredById = users.filter(function (item) {
      return item.id === id;
    });
    return filteredById;
  }
  if (email) {
    const filteredByEmail = users.filter(function (item) {
      return item.email === email;
    });
    return filteredByEmail;
  }
  if (gitlabId) {
    const filteredByGitlab = users.filter(function (item) {
      return item.gitlabId === gitlabId;
    });
    return filteredByGitlab;
  }

  return users;
};

// query to get all users, with some inputs to limit the search to specific email, id, or gitlabId
export const getUserByEmail: ResolverFn = async (
  _root,
  { email },
  { sqlClientPool, models, hasPermission, keycloakGrant },
) => {

  const user = await models.UserModel.loadUserByUsername(email);
  if (keycloakGrant) {
    if (keycloakGrant.access_token.content.sub == user.id) {
      await hasPermission('ssh_key', 'view:user', {
        users: [user.id]
      });
    } else {
      await hasPermission('user', 'viewAll');
    }
  } else {
    await hasPermission('user', 'viewAll');
  }

  return user;
};

export const addUser: ResolverFn = async (
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
  }, input.resetPassword);

  return user;
};

export const updateUser: ResolverFn = async (
  _root,
  { input: { user: userInput, patch } },
  { models, hasPermission },
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
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

export const resetUserPassword: ResolverFn = async (
  _root,
  { input: { user: userInput } },
  { models, hasPermission },
) => {
  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
  });

  // someone can reset their own password if they want to, but admins will be able to do this
  await hasPermission('user', 'update', {
    users: [user.id],
  });

  await models.UserModel.resetUserPassword(user.id);

  return 'success';
};

export const deleteUser: ResolverFn = async (
  _root,
  { input: { user: userInput } },
  { models, hasPermission },
) => {
  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
  });

  await hasPermission('user', 'delete', {
    users: [user.id],
  });

  await models.UserModel.deleteUser(user.id);

  return 'success';
};

// addUserToOrganization adds a user as an organization owner
export const addUserToOrganization: ResolverFn = async (
  _root,
  { input: { user: userInput, organization: organization, admin: admin, owner: owner } },
  { sqlClientPool, models, hasPermission, userActivityLogger },
) => {

  const organizationData = await organizationHelpers(sqlClientPool).getOrganizationById(organization);
  if (organizationData === undefined) {
    throw new Error(`Organization does not exist`)
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
  });

  let updateUser = {
    id: user.id,
    organization: organization,
    admin: false,
    owner: false,
  }
  if (owner) {
    await hasPermission('organization', 'addOwner', {
      organization: organization
    });
    updateUser.owner = true
  } else {
    if (admin) {
      await hasPermission('organization', 'addOwner', {
        organization: organization
      });
      updateUser.admin = true
    } else {
      await hasPermission('organization', 'addViewer', {
        organization: organization
      });
    }
  }
  await models.UserModel.updateUser(updateUser);

  userActivityLogger(`User added a user to organization '${organizationData.name}'`, {
    project: '',
    event: 'api:addUserToOrganization',
    payload: {
      user: {
        id: user.id,
        email: user.email,
        organization: organization,
        admin: admin,
        owner: owner,
      },
    }
  });

  return organizationData;

};

// removeUserFromOrganization a user as an organization owner
export const removeUserFromOrganization: ResolverFn = async (
  _root,
  { input: { user: userInput, organization: organization } },
  { sqlClientPool, models, hasPermission, userActivityLogger },
) => {

  const organizationData = await organizationHelpers(sqlClientPool).getOrganizationById(organization);
  if (organizationData === undefined) {
    throw new Error(`Organization does not exist`)
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
  });

  await hasPermission('organization', 'addOwner', {
    organization: organization
  });

  await models.UserModel.updateUser({
    id: user.id,
    organization: organization,
    remove: true,
  });

  userActivityLogger(`User removed a user from organization '${organizationData.name}'`, {
    project: '',
    event: 'api:addUserToOrganization',
    payload: {
      user: {
        id: user.id,
        organization: organization,
      },
    }
  });

  return organizationData;
};
