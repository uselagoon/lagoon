// @flow

const R = require('ramda');
const pickNonNil = require('../util/pickNonNil');
const { query, isPatchEmpty } = require('./utils');

const {
  getCustomerIdByName,
  getCustomerById,
  getAllCustomerIds,
} = require('./customer').Helpers;

// TEMPORARY: Don't copy this file naming structure.
// This is just temporarily here to avoid the problems from the circular dependency between the `project` and `user` helpers.
//
// Eventually we should move to a better folder structure and away from the DAO structure. Example folder structure: https://github.com/sysgears/apollo-universal-starter-kit/tree/e2c43fcfdad8b2a4a3ca0b491bbd1493fcaee255/packages/server/src/modules/post
const {
  getProjectById,
  getProjectIdByName,
  getProjectIdsByCustomerIds,
  getCustomerProjectsWithoutDirectUserAccess,
  getAllProjectNames,
} = require('./project.helpers');
const KeycloakOperations = require('./user.keycloak');
const Sql = require('./user.sql');

const moveUserSshKeyToObject = ({
  id,
  email,
  firstName,
  lastName,
  comment,
  gitlabId,
  sshKeyId,
  sshKeyName,
  sshKeyValue,
  sshKeyType,
  sshKeyCreated,
}) => ({
  id,
  email,
  firstName,
  lastName,
  comment,
  gitlabId,
  sshKey: {
    id: sshKeyId,
    name: sshKeyName,
    value: sshKeyValue,
    type: sshKeyType,
    created: sshKeyCreated,
  },
});

const getUserBySshKey = ({ sqlClient }) => async ({ role }, { sshKey }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const [keyType, keyValue] = R.compose(
    R.split(' '),
    R.defaultTo(''),
  )(sshKey);

  const rows = await query(
    sqlClient,
    Sql.selectUserBySshKey({ keyType, keyValue }),
  );
  return R.prop(0, rows);
};

const getUsersByProjectId = ({ sqlClient }) => async (
  { role, permissions: { customers, projects } },
  projectId,
) => {
  if (role !== 'admin') {
    const customerProjectIds = await getProjectIdsByCustomerIds(
      sqlClient,
      customers,
    );

    if (!R.contains(projectId, R.concat(projects, customerProjectIds))) {
      throw new Error('Unauthorized.');
    }
  }

  const rows = await query(
    sqlClient,
    Sql.selectUsersByProjectId({ projectId }),
  );
  return R.map(moveUserSshKeyToObject, rows);
};

const addUser = ({ sqlClient, keycloakClient }) => async (
  cred,
  {
    id, email, firstName, lastName, comment, gitlabId,
  },
) => {
  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertUser({
      id,
      email,
      firstName,
      lastName,
      comment,
      gitlabId,
    }),
  );
  const rows = await query(sqlClient, Sql.selectUser(insertId));
  const user = R.prop(0, rows);

  await KeycloakOperations.createUser(keycloakClient, {
    ...pickNonNil(['email', 'firstName', 'lastName'], user),
    username: R.prop('email', user),
    enabled: true,
    attributes: {
      'lagoon-uid': [R.prop('id', user)],
    },
  });

  return user;
};

const updateUser = ({ sqlClient, keycloakClient }) => async (
  { role, userId },
  {
    id, patch, patch: {
      email, firstName, lastName, comment, gitlabId,
    },
  },
) => {
  if (role !== 'admin' && !R.equals(userId, id)) {
    throw new Error('Unauthorized.');
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const originalUser = R.prop(0, await query(sqlClient, Sql.selectUser(id)));

  await query(
    sqlClient,
    Sql.updateUser({
      id,
      patch: {
        email,
        firstName,
        lastName,
        comment,
        gitlabId,
      },
    }),
  );

  const rows = await query(sqlClient, Sql.selectUser(id));

  if (typeof email === 'string') {
    // Because Keycloak cannot update usernames, we must delete the original user...
    await KeycloakOperations.deleteUser(
      keycloakClient,
      R.prop('email', originalUser),
    );

    // ...and then create a new one.
    await KeycloakOperations.createUser(keycloakClient, {
      username: email,
      email,
      // Use the updated firstName and lastName if truthy,
      // falling back to the values from the originalUser
      firstName: firstName || R.prop('firstName', originalUser),
      lastName: lastName || R.prop('lastName', originalUser),
      enabled: true,
      attributes: {
        'lagoon-uid': [id],
      },
    });
  }

  return R.prop(0, rows);
};

const deleteUser = ({ sqlClient, keycloakClient }) => async (
  { role, userId },
  { id },
) => {
  if (role !== 'admin' && !R.equals(userId, id)) {
    throw new Error('Unauthorized.');
  }

  // Load the full user as we need it to remove it later from Keycloak
  const rows = await query(sqlClient, Sql.selectUser(id));
  const user = R.prop(0, rows);

  await query(sqlClient, Sql.removeUserFromAllProjects({ id }));
  await query(sqlClient, Sql.removeUserFromAllCustomers({ id }));

  await query(
    sqlClient,
    Sql.deleteUser({
      id,
    }),
  );

  await KeycloakOperations.deleteUser(keycloakClient, R.prop('email', user));

  return 'success';
};

const addUserToProject = ({ sqlClient, keycloakClient }) => async (
  { role, permissions: { projects } },
  { project, userId },
) => {
  // Will throw on invalid conditions
  const projectId = await getProjectIdByName(sqlClient, project);

  if (role !== 'admin' && !R.contains(projectId, projects)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.addUserToProject({ projectId, userId }));

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  await KeycloakOperations.addUserToGroup(keycloakClient, {
    username,
    groupName: project,
  });

  return getProjectById(sqlClient, projectId);
};

const removeUserFromProject = ({ sqlClient, keycloakClient }) => async (
  { role, permissions: { projects } },
  { project, userId },
) => {
  // Will throw on invalid conditions
  const projectId = await getProjectIdByName(sqlClient, project);

  if (role !== 'admin' && !R.contains(projectId, projects)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.removeUserFromProject({ projectId, userId }));

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  await KeycloakOperations.deleteUserFromGroup(keycloakClient, {
    username,
    groupName: project,
  });

  return getProjectById(sqlClient, projectId);
};

const getUsersByCustomerId = ({ sqlClient }) => async (
  { role, permissions: { customers } },
  customerId,
) => {
  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  const rows = await query(
    sqlClient,
    Sql.selectUsersByCustomerId({ customerId }),
  );
  return R.map(moveUserSshKeyToObject, rows);
};

const addUserToCustomer = ({ sqlClient, keycloakClient }) => async (
  { role, permissions: { customers } },
  { customer, userId },
) => {
  // Will throw on invalid conditions
  const customerId = await getCustomerIdByName(sqlClient, customer);

  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.addUserToCustomer({ customerId, userId }));

  // Get customer projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  const projects = await getCustomerProjectsWithoutDirectUserAccess(
    sqlClient,
    [customerId],
    [userId],
  );

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  for (const project of projects) {
    await KeycloakOperations.addUserToGroup(keycloakClient, {
      username,
      groupName: R.prop('name', project),
    });
  }

  return getCustomerById(sqlClient, customerId);
};

const removeUserFromCustomer = ({ sqlClient, keycloakClient }) => async (
  { role, permissions: { customers } },
  { customer, userId },
) => {
  // Will throw on invalid conditions
  const customerId = await getCustomerIdByName(sqlClient, customer);

  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  // Get customer projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  const projects = await getCustomerProjectsWithoutDirectUserAccess(
    sqlClient,
    [customerId],
    [userId],
  );

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  for (const project of projects) {
    await KeycloakOperations.deleteUserFromGroup(keycloakClient, {
      username,
      groupName: R.prop('name', project),
    });
  }

  // The removal query needs to be performed further down in the function because the query in  `getCustomerProjectsWithoutDirectUserAccess` needs the connection between user and customer to still exist.
  await query(sqlClient, Sql.removeUserFromCustomer({ customerId, userId }));
  return getCustomerById(sqlClient, customerId);
};

const deleteAllUsers = ({ sqlClient, keycloakClient }) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const emails /* : Array<string> */ = R.map(
    R.prop('email'),
    await query(sqlClient, Sql.selectAllUserEmails()),
  );
  await query(sqlClient, Sql.truncateUser());

  for (const email of emails) {
    await KeycloakOperations.deleteUser(keycloakClient, email);
  }

  // TODO: Check rows for success
  return 'success';
};

const removeAllUsersFromAllCustomers = ({
  sqlClient,
  keycloakClient,
}) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const customerIds = await getAllCustomerIds(sqlClient);

  const users /* : Array<{id: number, email: string}> */ = await query(
    sqlClient,
    Sql.selectAllUsers(),
  );

  await query(sqlClient, Sql.truncateCustomerUser());

  for (const user of users) {
    for (const customerId of customerIds) {
      // Get customer projects where given user ids do not have other access via `project_user` (put another way, projects where the user loses access if they lose customer access).
      const projects = await getCustomerProjectsWithoutDirectUserAccess(
        sqlClient,
        [customerId],
        [R.prop('id', user)],
      );

      // Remove all users from all Keycloak groups that correspond to all customer projects
      for (const project of projects) {
        await KeycloakOperations.deleteUserFromGroup(keycloakClient, {
          username: R.prop('email', user),
          groupName: R.prop('name', project),
        });
      }
    }
  }

  // TODO: Check rows for success
  return 'success';
};

const removeAllUsersFromAllProjects = ({
  sqlClient,
  keycloakClient,
}) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const emails /* : Array<string> */ = R.map(
    R.prop('email'),
    await query(sqlClient, Sql.selectAllUserEmails()),
  );
  const projectNames = await getAllProjectNames(sqlClient);

  await query(sqlClient, Sql.truncateProjectUser());

  // Remove all users from all Keycloak groups that correspond to all projects
  for (const email of emails) {
    for (const name of projectNames) {
      await KeycloakOperations.deleteUserFromGroup(keycloakClient, {
        username: email,
        groupName: name,
      });
    }
  }

  // TODO: Check rows for success
  return 'success';
};

module.exports = {
  Resolvers: {
    getUserBySshKey,
    getUsersByCustomerId,
    addUser,
    updateUser,
    deleteUser,
    addUserToCustomer,
    removeUserFromCustomer,
    getUsersByProjectId,
    addUserToProject,
    removeUserFromProject,
    deleteAllUsers,
    removeAllUsersFromAllCustomers,
    removeAllUsersFromAllProjects,
  },
};
