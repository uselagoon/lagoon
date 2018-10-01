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
  selectUser: id =>
    knex('user')
      .where('id', '=', id)
      .toString(),
  selectUserBySshKey: ({ keyValue, keyType }) =>
    knex('user')
      .join('user_ssh_key as usk', 'usk.usid', '=', 'user.id')
      .join('ssh_key as sk', 'sk.id', '=', 'usk.skid')
      .where('sk.key_value', keyValue)
      .andWhere('sk.key_type', keyType)
      .toString(),
  selectUsersByProjectId: ({ projectId }) =>
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
  selectUsersByCustomerId: ({ customerId }) =>
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
  insertUser: ({
    id, email, firstName, lastName, comment,
  }) =>
    knex('user')
      .insert({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        comment,
      })
      .toString(),
  updateUser: ({ id, patch }) =>
    knex('user')
      .where('id', id)
      .update(patch)
      .toString(),
  deleteUser: ({ id }) =>
    knex('user')
      .where('id', id)
      .del()
      .toString(),
  addUserToProject: ({ projectId, userId }) =>
    knex('project_user')
      .insert({
        usid: userId,
        pid: projectId,
      })
      .toString(),
  removeUserFromProject: ({ projectId, userId }) =>
    knex('project_user')
      .where('pid', projectId)
      .andWhere('usid', userId)
      .del()
      .toString(),
  removeUserFromAllProjects: ({ id }) =>
    knex('project_user')
      .where('usid', id)
      .del()
      .toString(),
  addUserToCustomer: ({ customerId, userId }) =>
    knex('customer_user')
      .insert({
        usid: userId,
        cid: customerId,
      })
      .toString(),
  removeUserFromCustomer: ({ customerId, userId }) =>
    knex('customer_user')
      .where('cid', customerId)
      .andWhere('usid', userId)
      .del()
      .toString(),
  removeUserFromAllCustomers: ({ id }) =>
    knex('customer_user')
      .where('usid', id)
      .del()
      .toString(),
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

  try {
    await keycloakClient.users.create({
      // Create the group in the `lagoon` realm.
      // TODO: Switch out if the `keycloak-admin` PR to override config gets merged https://github.com/Canner/keycloak-admin/pull/4
      realm: 'lagoon',
      ...pickNonNil(['email', 'firstName', 'lastName'], user),
      username: R.prop('email', user),
      enabled: true,
      attributes: {
        'lagoon-uid': [R.prop('id', user)],
      },
    });
  } catch (err) {
    if (err.response.status === 409) {
      logger.warn(
        `Failed to create already existing Keycloak user "${R.prop(
          'email',
          user,
        )}"`,
      );
    } else {
      logger.error(`SearchGuard create user error: ${err}`);
      throw new Error(`SearchGuard create user error: ${err}`);
    }
  }

  return user;
};

const updateUser = ({ sqlClient }) => async (
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

  return R.prop(0, rows);
};

const deleteUser = ({ sqlClient, keycloakClient }) => async (
  { role, userId },
  { id },
) => {
  if (role !== 'admin' && !R.equals(userId, id)) {
    throw new Error('Unauthorized.');
  }

  // Load the full user as we need it to remove it later from keyCloak
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

  try {
    // Load the Keycloak User ID based on the username (which is the email)
    const keycloakUserList = await keycloakClient.users.find({
      username: R.prop('email', user),
      realm: 'lagoon',
    });

    const keycloakUser = R.prop(0, keycloakUserList);
    await keycloakClient.users.del({
      id: R.prop('id', keycloakUser),
      realm: 'lagoon',
    });
  } catch (err) {
    logger.error(`SearchGuard delete user error: ${err}`);
    throw new Error(`SearchGuard delete user error: ${err}`);
  }

  return 'success';
};

const addUserToProject = ({ sqlClient }) => async (
  { role, permissions: { projects } },
  { project, userId },
) => {
  // Will throw on invalid conditions
  const projectId = await getProjectIdByName(sqlClient, project);

  if (role !== 'admin' && !R.contains(projectId, projects)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.addUserToProject({ projectId, userId }));
  return getProjectById(sqlClient, projectId);
};

const removeUserFromProject = ({ sqlClient }) => async (
  { role, permissions: { projects } },
  { project, userId },
) => {
  // Will throw on invalid conditions
  const projectId = await getProjectIdByName(sqlClient, project);

  if (role !== 'admin' && !R.contains(projectId, projects)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.removeUserFromProject({ projectId, userId }));
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

module.exports = {
  Sql,
  Queries: {
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
  },
};
