// @flow

const R = require('ramda');
const { query, isPatchEmpty, knex } = require('./utils');


const getBackupsByEnvironmentId = ({ sqlClient }) => async (
  { role, permissions: { customers, projects } },
  environmentId,
) => {
  const rows = await query(
    sqlClient,
    Sql.selectBackupsByEnvironmentId({ environmentId }),
  );
  return rows;
};

const addBackup = ({ sqlClient }) => async (
  cred,
  {
    id, environment, backupSource, backupId, created,
  },
) => {
  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertBackup({
      id,
      environment,
      backupSource,
      backupId,
      created,
    }),
  );
  const rows = await query(sqlClient, Sql.selectBackup(insertId));
  return R.prop(0, rows);
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

const deleteUser = ({ sqlClient }) => async ({ role, userId }, { id }) => {
  if (role !== 'admin' && !R.equals(userId, id)) {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.removeUserFromAllProjects({ id }));
  await query(sqlClient, Sql.removeUserFromAllCustomers({ id }));

  await query(
    sqlClient,
    Sql.deleteUser({
      id,
    }),
  );

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

const Resolvers /* : ResolversObj */ = {
  addBackup,
  getBackupsByEnvironmentId,
};

module.exports = Resolvers;
