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

  if (email) {
    try {
      // use the model to get a user by email address instead of filtering
      const user = await models.UserModel.loadUserByEmail(email);
      return [user]
    } catch (e) {
      // if no user found, return empty user list like before
      return []
    }
  }
  if (id) {
    try {
      // use the model to get a user by id instead of filtering
      const user = await models.UserModel.loadUserById(id);
      return [user]
    } catch (e) {
      // if no user found, return empty user list like before
      return []
    }
  }
  // since gitlab users are harder to check, do the all users query and then filter them
  const users = await models.UserModel.loadAllUsers();
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

  const user = await models.UserModel.loadUserByEmail(email);
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

  const user = await models.UserModel.loadUserByIdOrEmail({
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
  const user = await models.UserModel.loadUserByIdOrEmail({
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
  const user = await models.UserModel.loadUserByIdOrEmail({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
  });

  await hasPermission('user', 'delete', {
    users: [user.id],
  });

  await models.UserModel.deleteUser(user.id);

  return 'success';
};

// @DEPRECATED use addAdminToOrganization - addUserToOrganization adds a user as an organization owner
export const addUserToOrganization: ResolverFn = async (
  _root,
  { input: { user: userInput, organization: organization, admin: admin, owner: owner } },
  { sqlClientPool, models, hasPermission, userActivityLogger },
) => {

  const organizationData = await organizationHelpers(sqlClientPool).getOrganizationById(organization);
  if (organizationData === undefined) {
    let scope = "addViewer"
    if (owner) {
      scope = "addOwner"
    } else {
      if (admin) {
        scope = "addOwner"
      }
    }
    throw new Error(`Unauthorized: You don't have permission to "${scope}" on "organization"`)
  }

  const user = await models.UserModel.loadUserByIdOrEmail({
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

// @DEPRECATED use removeAdminFromOrganization - removeUserFromOrganization a user as an organization owner
export const removeUserFromOrganization: ResolverFn = async (
  _root,
  { input: { user: userInput, organization: organization } },
  { sqlClientPool, models, hasPermission, userActivityLogger },
) => {

  const organizationData = await organizationHelpers(sqlClientPool).getOrganizationById(organization);
  if (organizationData === undefined) {
    throw new Error(`Unauthorized: You don't have permission to "addOwner" on "organization"`)
  }

  const user = await models.UserModel.loadUserByIdOrEmail({
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

// addAdminToOrganization adds a user as an organization administrator
export const addAdminToOrganization: ResolverFn = async (
  _root,
  { input: { user: userInput, organization: organization, role } },
  { sqlClientPool, models, hasPermission, userActivityLogger },
) => {
  let updateUser = {
    id: "",
    admin: false,
    owner: false,
    organization: 0
  }
  let scope = "addOwner"
  switch (role) {
    case "ADMIN":
      scope = "addOwner"
      updateUser.admin = true
      break;
    case "OWNER":
      scope = "addOwner"
      updateUser.owner = true
      break;
    case "VIEWER": //fallthrough default
    default:
      scope = "addViewer"
      updateUser.admin = false
      updateUser.owner = false
      break;
  }
  const organizationData = await organizationHelpers(sqlClientPool).getOrganizationByOrganizationInput(
    organization,
    scope,
    "organization"
  );
  if (organizationData === undefined) {
    throw new Error(`Unauthorized: You don't have permission to "${scope}" on "organization"`)
  }

  const user = await models.UserModel.loadUserByIdOrEmail({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
  });

  updateUser.id = user.id
  updateUser.organization = organizationData.id

  await hasPermission('organization', scope, {
    organization: organizationData.id
  });

  await models.UserModel.updateUser(updateUser);

  userActivityLogger(`User added an administrator to organization '${organizationData.name}'`, {
    project: '',
    event: 'api:addAdminToOrganization',
    payload: {
      user: {
        id: user.id,
        email: user.email,
        organization: organizationData.id,
        role: role,
      },
    }
  });

  return organizationData;
};

// removeAdminFromOrganization an administrator from and organization
export const removeAdminFromOrganization: ResolverFn = async (
  _root,
  { input: { user: userInput, organization } },
  { sqlClientPool, models, hasPermission, userActivityLogger },
) => {

  const scope = 'addOwner'
  const organizationData = await organizationHelpers(sqlClientPool).getOrganizationByOrganizationInput(
    organization,
    scope,
    "organization"
  );
  if (organizationData === undefined) {
    throw new Error(`Unauthorized: You don't have permission to scope on "organization"`)
  }

  const user = await models.UserModel.loadUserByIdOrEmail({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput),
  });

  await hasPermission('organization', scope, {
    organization: organizationData.id
  });

  await models.UserModel.updateUser({
    id: user.id,
    organization: organizationData.id,
    remove: true,
  });

  userActivityLogger(`User removed an administrator from organization '${organizationData.name}'`, {
    project: '',
    event: 'api:removeAdminFromOrganization',
    payload: {
      user: {
        id: user.id,
        organization: organizationData.id,
      },
    }
  });

  return organizationData;
};

// query to list all platform users
export const getAllPlatformUsers: ResolverFn = async (
  _root,
  { id, email, gitlabId, role },
  { models, adminScopes },
) => {
  // if user is platform owner or viewer
  if (adminScopes.platformOwner || adminScopes.platformViewer) {
    const users = await models.UserModel.loadAllPlatformUsers();
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
    if (role) {
      const filteredByPlatformRole = users.filter(function (item) {
        const found = item.platformRoles.some(el => el === role);
        if (found) {
          return item;
        }
      });
      return filteredByPlatformRole;
    }
    return users;
  } else {
    throw new Error(
      `Unauthorized: You don't have permission to perform this action`
    );
  }
};

// addPlatformRoleToUser is used to add platform-owner or platform-viewer to a user
export const addPlatformRoleToUser: ResolverFn = async (
  _root,
  { user: userInput, role },
  { models, userActivityLogger, adminScopes },
) => {
  // if user is platform owner
  if (adminScopes.platformOwner) {
    const user = await models.UserModel.loadUserByIdOrEmail({
      id: R.prop('id', userInput),
      email: R.prop('email', userInput),
    });
    await models.UserModel.addPlatformRoleToUser(user, role);
    const users = await models.UserModel.loadAllPlatformUsers();
    const filteredByEmail = users.filter(function (item) {
      return item.email === user.email;
    });
    userActivityLogger(`User added a platform role to user '${user.email}'`, {
      project: '',
      event: 'api:addPlatformRoleToUser',
      payload: {
        user: {
          id: user.id,
          email: user.email,
          role: role,
        },
      }
    });
    return filteredByEmail[0];
  } else {
    throw new Error(
      `Unauthorized: You don't have permission to perform this action`
    );
  }
};

// removePlatformRoleFromUser will remove a platform role from a user
export const removePlatformRoleFromUser: ResolverFn = async (
  _root,
  { user: userInput, role },
  { models, userActivityLogger, adminScopes },
) => {
  // if user is platform owner
  if (adminScopes.platformOwner) {
    const user = await models.UserModel.loadUserByIdOrEmail({
      id: R.prop('id', userInput),
      email: R.prop('email', userInput),
    });
    await models.UserModel.removePlatformRoleFromUser(user, role);
    const users = await models.UserModel.loadAllPlatformUsers();
    const filteredByEmail = users.filter(function (item) {
      return item.email === user.email;
    });
    userActivityLogger(`User removed platform role from user '${user.email}'`, {
      project: '',
      event: 'api:removePlatformRoleFromUser',
      payload: {
        user: {
          id: user.id,
          email: user.email,
          role: role,
        },
      }
    });
    if (filteredByEmail[0]) {
      return filteredByEmail[0]
    }
    return user;
  } else {
    throw new Error(
      `Unauthorized: You don't have permission to perform this action`
    );
  }
};
