// @flow

const R = require('ramda');
const keycloakClient = require('../../clients/keycloakClient');
const sqlClient = require('../../clients/sqlClient');
const logger = require('../../logger');
const sleep = require('es7-sleep');

const {
  query,
  isPatchEmpty,
} = require('../../util/db');

const {
  getCustomerIdByName,
  getCustomerById,
  getAllCustomerIds,
  getAllCustomers,
} = require('../customer/helpers');
const {
  getProjectById,
  getProjectIdByName,
  getProjectIdsByCustomerIds,
  getCustomerProjectsWithoutDirectUserAccess,
  getAllProjectNames,
  getAllProjects,
} = require('../project/helpers');
const KeycloakOperations = require('./keycloak');
const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

const getUsersByProjectId = async (
  { id: projectId },
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  if (role !== 'admin') {
    const customerProjectIds = await getProjectIdsByCustomerIds(customers);

    if (!R.contains(projectId, R.concat(projects, customerProjectIds))) {
      throw new Error('Unauthorized.');
    }
  }

  const rows = await query(
    sqlClient,
    Sql.selectUsersByProjectId({ projectId }),
  );

  return rows;
};

const getUserBySshKey = async (root, { sshKey }, { credentials: { role } }) => {
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

const addUser = async (
  root,
  {
    input: {
      id, email, firstName, lastName, comment, gitlabId,
    },
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

  await KeycloakOperations.createUser(user);

  return user;
};

const updateUser = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        email, firstName, lastName, comment, gitlabId,
      },
    },
  },
  { credentials: { role, userId } },
) => {
  if (role !== 'admin' && !R.equals(userId, id)) {
    throw new Error('Unauthorized.');
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const originalUser = R.prop(0, await query(sqlClient, Sql.selectUser(id)));
  const originalEmail = R.prop('email', originalUser);

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

  if (typeof email === 'string' && email !== originalEmail) {
    const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
      originalEmail,
    );

    const groups = await keycloakClient.users.listGroups({
      id: keycloakUserId,
    });

    // Because Keycloak cannot update usernames, we must delete the original user...
    await KeycloakOperations.deleteUserById(keycloakUserId, originalEmail);

    // ...and then create a new one.
    await KeycloakOperations.createUser({
      id,
      email,
      // Use the updated firstName and lastName if truthy,
      // falling back to the values from the originalUser
      firstName: firstName || R.prop('firstName', originalUser),
      lastName: lastName || R.prop('lastName', originalUser),
    });

    for (const group of groups) {
      await KeycloakOperations.addUserToGroup({
        username: email,
        groupName: R.prop('name', group),
      });
    }

    // If user had a gitlabid before, map that ID to the new user in Keycloak
    if (originalUser.gitlabId) {
      await KeycloakOperations.linkUserToGitlab({
        username: email,
        gitlabUserId: originalUser.gitlabId,
      });
    }
  }

  // Update of gitlabid: Remove the link and add it
  if (typeof gitlabId === 'number') {
    await KeycloakOperations.removeGitlabLink(originalUser.email);
    await KeycloakOperations.linkUserToGitlab({
      username: originalUser.email,
      gitlabUserId: gitlabId,
    });
  }

  return R.prop(0, rows);
};

const deleteUser = async (
  root,
  { input: { id } },
  { credentials: { role, userId } },
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

  await KeycloakOperations.deleteUserByUsername(R.prop('email', user));

  return 'success';
};

const addUserToProject = async (
  root,
  { input: { project, userId } },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  // Will throw on invalid conditions
  const projectId = await getProjectIdByName(project);

  if (role !== 'admin' && !R.contains(projectId, projects)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.addUserToProject({ projectId, userId }));

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  await KeycloakOperations.addUserToGroup({
    username,
    groupName: project,
  });

  return getProjectById(projectId);
};

const removeUserFromProject = async (
  root,
  { input: { project, userId } },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  // Will throw on invalid conditions
  const projectId = await getProjectIdByName(project);

  if (role !== 'admin' && !R.contains(projectId, projects)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.removeUserFromProject({ projectId, userId }));

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  await KeycloakOperations.deleteUserFromGroup({
    username,
    groupName: project,
  });

  return getProjectById(projectId);
};

const getUsersByCustomerId = async (
  { id: customerId },
  args,
  {
    credentials: {
      role,
      permissions: { customers },
    },
  },
) => {
  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  const rows = await query(
    sqlClient,
    Sql.selectUsersByCustomerId({ customerId }),
  );
  return rows;
};

const getProjectsByCustomerId = async (
  { id: customerId },
  args,
  {
    credentials: {
      role,
      permissions: { customers },
    },
  },
) => {
  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  const rows = await query(
    sqlClient,
    Sql.selectProjectsByCustomerId({ customerId }),
  );
  return rows;
};

const addUserToCustomer = async (
  root,
  { input: { customer, userId } },
  {
    credentials: {
      role,
      permissions: { customers },
    },
  },
) => {
  // Will throw on invalid conditions
  const customerId = await getCustomerIdByName(customer);

  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.addUserToCustomer({ customerId, userId }));

  // Get customer projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  const projects = await getCustomerProjectsWithoutDirectUserAccess(
    [customerId],
    [userId],
  );

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  for (const project of projects) {
    await KeycloakOperations.addUserToGroup({
      username,
      groupName: R.prop('name', project),
    });
  }

  return getCustomerById(customerId);
};

const removeUserFromCustomer = async (
  root,
  { input: { customer, userId } },
  {
    credentials: {
      role,
      permissions: { customers },
    },
  },
) => {
  // Will throw on invalid conditions
  const customerId = await getCustomerIdByName(customer);

  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  // Get customer projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  const projects = await getCustomerProjectsWithoutDirectUserAccess(
    [customerId],
    [userId],
  );

  const username = R.path(
    [0, 'email'],
    await query(sqlClient, Sql.selectUser(userId)),
  );

  for (const project of projects) {
    await KeycloakOperations.deleteUserFromGroup({
      username,
      groupName: R.prop('name', project),
    });
  }

  // The removal query needs to be performed further down in the function because the query in  `getCustomerProjectsWithoutDirectUserAccess` needs the connection between user and customer to still exist.
  await query(sqlClient, Sql.removeUserFromCustomer({ customerId, userId }));
  return getCustomerById(customerId);
};

const deleteAllUsers = async (root, args, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const emails /* : Array<string> */ = R.map(
    R.prop('email'),
    await query(sqlClient, Sql.selectAllUserEmails()),
  );
  await query(sqlClient, Sql.truncateUser());

  for (const email of emails) {
    await KeycloakOperations.deleteUserByUsername(email);
  }

  // TODO: Check rows for success
  return 'success';
};

const createAllUsersInKeycloak = async (root, args, {
  credentials: {
    role,
  },
}) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const users = await query(sqlClient, Sql.selectAllUsers());

  // FIRST: Create all Users in Keycloack
  for (const user of users) {
    logger.debug(`createAllUsersInKeycloak: Processing user: ${R.prop('email', user)}`);
    await KeycloakOperations.createUser(user);
  }

  // SECOND: Give access to projects which users have direct access

  // Load all projects
  const projects = await getAllProjects();
  for (const project of projects) {
    logger.debug(`createAllUsersInKeycloak: Processing project: ${R.prop('name', project)}`);
    // Load users that have access to this project
    const project_users = await query(sqlClient, Sql.selectUsersByProjectId({ projectId: R.prop('id', project) }));
    for (const project_user of project_users) {
      await KeycloakOperations.addUserToGroup({
        username: R.prop('email', project_user),
        groupName: R.prop('name', project),
      });
    }
  }

  // THIRD: Give access to projects via customer assignement (but only the ones that the users maybe don't have direct acces via project assignement)

  // Load all customers
  const customers = await getAllCustomers();
  for (const customer of customers) {
    logger.debug(`createAllUsersInKeycloak: Processing customer: ${R.prop('name', customer)}`);
    // Load users that have access to this customer
    const customer_users = await query(sqlClient, Sql.selectUsersByCustomerId({ customerId: R.prop('id', customer) }));
    for (const customer_user of customer_users) {
      logger.debug(`createAllUsersInKeycloak: Processing user "${R.prop('email', customer_user)}" having access to customer: ${R.prop('name', customer)}`);
      // Load all projects that are given access because the user has access to the project's customer
      // But only if the access is not given also directly to the project itself.
      const customer_user_projects = await getCustomerProjectsWithoutDirectUserAccess(
        [R.prop('id', customer)],
        [R.prop('id', customer_user)],
      );

      for (const customer_user_project of customer_user_projects) {
        try {
          await KeycloakOperations.addUserToGroup({
            username: R.prop('email', customer_user),
            groupName: R.prop('name', customer_user_project),
          });
        } catch (err) {
          // the above request can take so long that the 55 secs keycloack timeout is hit, if this is the case, we just wait for 2 secs and try again
          await sleep(3000);
          await KeycloakOperations.addUserToGroup({
            username: R.prop('email', customer_user),
            groupName: R.prop('name', customer_user_project),
          });
        }
      }
    }
  }

  return 'success';
};

const removeAllUsersFromAllCustomers = async (
  root,
  args,
  { credentials: { role } },
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const customerIds = await getAllCustomerIds();

  const users /* : Array<{id: number, email: string}> */ = await query(
    sqlClient,
    Sql.selectAllUsers(),
  );

  await query(sqlClient, Sql.truncateCustomerUser());

  for (const user of users) {
    for (const customerId of customerIds) {
      // Get customer projects where given user ids do not have other access via `project_user` (put another way, projects where the user loses access if they lose customer access).
      const projects = await getCustomerProjectsWithoutDirectUserAccess(
        [customerId],
        [R.prop('id', user)],
      );

      // Remove all users from all Keycloak groups that correspond to all customer projects
      for (const project of projects) {
        await KeycloakOperations.deleteUserFromGroup({
          username: R.prop('email', user),
          groupName: R.prop('name', project),
        });
      }
    }
  }

  // TODO: Check rows for success
  return 'success';
};

const removeAllUsersFromAllProjects = async (
  root,
  args,
  { credentials: { role } },
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const emails /* : Array<string> */ = R.map(
    R.prop('email'),
    await query(sqlClient, Sql.selectAllUserEmails()),
  );
  const projectNames = await getAllProjectNames();

  await query(sqlClient, Sql.truncateProjectUser());

  // Remove all users from all Keycloak groups that correspond to all projects
  for (const email of emails) {
    for (const name of projectNames) {
      await KeycloakOperations.deleteUserFromGroup({
        username: email,
        groupName: name,
      });
    }
  }

  // TODO: Check rows for success
  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  getUsersByProjectId,
  getUserBySshKey,
  addUser,
  updateUser,
  deleteUser,
  addUserToCustomer,
  removeUserFromCustomer,
  getUsersByCustomerId,
  getProjectsByCustomerId,
  addUserToProject,
  removeUserFromProject,
  deleteAllUsers,
  removeAllUsersFromAllCustomers,
  removeAllUsersFromAllProjects,
  createAllUsersInKeycloak,
};

module.exports = Resolvers;
