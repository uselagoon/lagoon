// @flow

const R = require('ramda');
const pickNonNil = require('../util/pickNonNil');
const { query, isPatchEmpty, knex } = require('./utils');
const logger = require('../logger');

const {
  getProjectIdByName,
  getProjectById,
  getProjectIdsByCustomerIds,
} = require('./project').Helpers;
const { getCustomerIdByName, getCustomerById } = require('./customer').Helpers;

const Sql = {
  selectUser: (id /* : number */) =>
    knex('user')
      .where('id', '=', id)
      .toString(),
  selectUsers: () => knex('user').toString(),
  selectUserBySshKey: (
    { keyValue, keyType } /* : {
    keyValue: string,
    keyType: string,
  } */,
  ) =>
    knex('user')
      .join('user_ssh_key as usk', 'usk.usid', '=', 'user.id')
      .join('ssh_key as sk', 'sk.id', '=', 'usk.skid')
      .where('sk.key_value', keyValue)
      .andWhere('sk.key_type', keyType)
      .toString(),
  selectUsersByProjectId: ({ projectId } /* : { projectId: number } */) =>
    knex('user')
      .join('project_user as pu', 'pu.usid', '=', 'user.id')
      .join('user_ssh_key as usk', 'usk.usid', '=', 'user.id')
      .join('ssh_key as sk', 'sk.id', '=', 'usk.skid')
      .select(
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.comment',
        'sk.id as ssh_key_id',
        'sk.name as ssh_key_name',
        'sk.key_value as ssh_key_value',
        'sk.key_type as ssh_key_type',
        'sk.created as ssh_key_created',
      )
      .where('pu.pid', projectId)
      .toString(),
  selectUsersByCustomerId: ({ customerId } /* : { customerId: number } */) =>
    knex('user')
      .join('customer_user as cu', 'cu.usid', '=', 'user.id')
      .join('user_ssh_key as usk', 'usk.usid', '=', 'user.id')
      .join('ssh_key as sk', 'sk.id', '=', 'usk.skid')
      .select(
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.comment',
        'sk.id as ssh_key_id',
        'sk.name as ssh_key_name',
        'sk.key_value as ssh_key_value',
        'sk.key_type as ssh_key_type',
        'sk.created as ssh_key_created',
      )
      .where('cu.cid', customerId)
      .toString(),
  insertUser: (
    {
      id,
      email,
      firstName,
      lastName,
      comment,
    } /* : {id: number, email: string, firstName: string, lastName: string, comment: string} */,
  ) =>
    knex('user')
      .insert({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        comment,
      })
      .toString(),
  updateUser: ({ id, patch } /* : {id: number, patch: {[string]: any}} */) =>
    knex('user')
      .where('id', id)
      .update(patch)
      .toString(),
  deleteUser: ({ id } /* : {id: number} */) =>
    knex('user')
      .where('id', id)
      .del()
      .toString(),
  addUserToProject: (
    { projectId, userId } /* : {projectId: number, userId: number} */,
  ) =>
    knex('project_user')
      .insert({
        usid: userId,
        pid: projectId,
      })
      .toString(),
  removeUserFromProject: (
    { projectId, userId } /* : {projectId: number, userId: number} */,
  ) =>
    knex('project_user')
      .where('pid', projectId)
      .andWhere('usid', userId)
      .del()
      .toString(),
  removeUserFromAllProjects: ({ id } /* : {id: number} */) =>
    knex('project_user')
      .where('usid', id)
      .del()
      .toString(),
  addUserToCustomer: (
    { customerId, userId } /* : {customerId: number, userId: number} */,
  ) =>
    knex('customer_user')
      .insert({
        usid: userId,
        cid: customerId,
      })
      .toString(),
  removeUserFromCustomer: (
    { customerId, userId } /* : {customerId: number, userId: number} */,
  ) =>
    knex('customer_user')
      .where('cid', customerId)
      .andWhere('usid', userId)
      .del()
      .toString(),
  removeUserFromAllCustomers: ({ id } /* : {id: number} */) =>
    knex('customer_user')
      .where('usid', id)
      .del()
      .toString(),
  truncateUser: () =>
    knex('user')
      .truncate()
      .toString(),
  truncateCustomerUser: () =>
    knex('customer_user')
      .truncate()
      .toString(),
  truncateProjectUser: () =>
    knex('project_user')
      .truncate()
      .toString(),
};

const KeycloakOperations = {
  findUserIdByUsername: async (
    username /* : string */,
    keycloakClient /* : Object */,
  ) =>
    R.path(
      [0, 'id'],
      await keycloakClient.users.findOne({
        username,
      }),
    ),
  createUser: async (
    payload /* :{
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    enabled: boolean,
    attributes: {
      [string]: any
    },
  } */,
    keycloakClient /* : Object */,
  ) => {
    try {
      await keycloakClient.users.create(payload);

      logger.debug(
        `Created Keycloak user with username ${R.prop('username', payload)}`,
      );
    } catch (err) {
      if (err.response.status === 409) {
        logger.warn(
          `Failed to create already existing Keycloak user "${R.prop(
            'email',
            payload,
          )}"`,
        );
      } else {
        logger.error(`Error creating Keycloak user: ${err}`);
        throw new Error(`Error creating Keycloak user: ${err}`);
      }
    }
  },
  deleteUser: async (
    user /* : {id: number, email: string} */,
    keycloakClient /* : Object */,
  ) => {
    try {
      // Find the Keycloak user id with a username matching the email
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        R.prop('email', user),
        keycloakClient,
      );

      // Delete the user
      await keycloakClient.users.del({ id: keycloakUserId });

      logger.debug(
        `Deleted Keycloak user with id ${keycloakUserId} (Lagoon id: ${R.prop(
          'id',
          user,
        )})`,
      );
    } catch (err) {
      logger.error(`Error deleting Keycloak user: ${err}`);
      throw new Error(`Error deleting Keycloak user: ${err}`);
    }
  },
  addUserToGroup: async (
    { username, groupName } /* : {username: string, groupName: string} */,
    keycloakClient /* : Object */,
  ) => {
    try {
      // Find the Keycloak user id by username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        username,
        keycloakClient,
      );

      // Find the Keycloak group id by name
      const keycloakGroupId = R.path(
        [0, 'id'],
        await keycloakClient.groups.find({
          search: groupName,
        }),
      );

      // Add the user to the group
      await keycloakClient.users.addToGroup({
        id: keycloakUserId,
        groupId: keycloakGroupId,
      });

      logger.debug(
        `Added Keycloak user with username ${username} to group "${groupName}"`,
      );
    } catch (err) {
      logger.error(`Error adding Keycloak user to group: ${err}`);
      throw new Error(`Error adding Keycloak user to group: ${err}`);
    }
  },
  deleteUserFromGroup: async (
    { username, groupName } /* : {username: string, groupName: string} */,
    keycloakClient /* : Object */,
  ) => {
    try {
      // Find the Keycloak user id by username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        username,
        keycloakClient,
      );

      // Find the Keycloak group id by name
      const keycloakGroupId = R.path(
        [0, 'id'],
        await keycloakClient.groups.find({
          search: groupName,
        }),
      );

      // Delete the user from the group
      await keycloakClient.users.delFromGroup({
        id: keycloakUserId,
        groupId: keycloakGroupId,
      });

      logger.debug(
        `Deleted Keycloak user with username ${username} from group "${groupName}"`,
      );
    } catch (err) {
      logger.error(`Error deleting Keycloak user from group: ${err}`);
      throw new Error(`Error deleting Keycloak user from group: ${err}`);
    }
  },
};

const moveUserSshKeyToObject = ({
  id,
  email,
  firstName,
  lastName,
  comment,
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
    const projectsFromCustomers = await getProjectIdsByCustomerIds(
      sqlClient,
      customers,
    );

    if (!R.contains(projectId, R.concat(projects, projectsFromCustomers))) {
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
    id, email, firstName, lastName, comment,
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
    }),
  );
  const rows = await query(sqlClient, Sql.selectUser(insertId));
  const user = R.prop(0, rows);

  await KeycloakOperations.createUser(
    {
      ...pickNonNil(['email', 'firstName', 'lastName'], user),
      username: R.prop('email', user),
      enabled: true,
      attributes: {
        'lagoon-uid': [R.prop('id', user)],
      },
    },
    keycloakClient,
  );

  return user;
};

const updateUser = ({ sqlClient, keycloakClient }) => async (
  { role, userId },
  {
    id, patch, patch: {
      email, firstName, lastName, comment,
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
      },
    }),
  );

  const rows = await query(sqlClient, Sql.selectUser(id));

  if (typeof email === 'string') {
    // Because Keycloak cannot update usernames, we must delete the original user...
    await KeycloakOperations.deleteUser(
      { id, email: R.prop('email', originalUser) },
      keycloakClient,
    );

    // ...and then create a new one.
    await KeycloakOperations.createUser(
      {
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
      },
      keycloakClient,
    );
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

  await KeycloakOperations.deleteUser(user, keycloakClient);

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

  await KeycloakOperations.addUserToGroup(
    { username, groupName: project },
    keycloakClient,
  );

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

  await KeycloakOperations.deleteUserFromGroup(
    { username, groupName: project },
    keycloakClient,
  );

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

const addUserToCustomer = ({ sqlClient }) => async (
  { role, permissions: { customers } },
  { customer, userId },
) => {
  // Will throw on invalid conditions
  const customerId = await getCustomerIdByName(sqlClient, customer);

  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.addUserToCustomer({ customerId, userId }));
  return getCustomerById(sqlClient, customerId);
};

const removeUserFromCustomer = ({ sqlClient }) => async (
  { role, permissions: { customers } },
  { customer, userId },
) => {
  // Will throw on invalid conditions
  const customerId = await getCustomerIdByName(sqlClient, customer);

  if (role !== 'admin' && !R.contains(customerId, customers)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.removeUserFromCustomer({ customerId, userId }));
  return getCustomerById(sqlClient, customerId);
};

const deleteAllUsers = ({ sqlClient, keycloakClient }) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const allUsers = await query(sqlClient, Sql.selectUsers());
  await query(sqlClient, Sql.truncateUser());

  for (const user of allUsers) {
    await KeycloakOperations.deleteUser(user, keycloakClient);
  }

  // TODO: Check rows for success
  return 'success';
};

const removeAllUsersFromAllCustomers = ({ sqlClient }) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateCustomerUser());

  // TODO: Check rows for success
  return 'success';
};

const removeAllUsersFromAllProjects = ({ sqlClient }) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateProjectUser());

  // TODO: Check rows for success
  return 'success';
};

module.exports = {
  Sql,
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
