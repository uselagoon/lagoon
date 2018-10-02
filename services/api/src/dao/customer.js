// @flow

const R = require('ramda');
const {
  ifNotAdmin,
  inClause,
  inClauseOr,
  isPatchEmpty,
  knex,
  prepare,
  query,
  whereAnd,
} = require('./utils');

const logger = require('../logger');

const Sql = {
  updateCustomer: (cred, input) => {
    const { id, patch } = input;
    const { customers } = cred.permissions;

    const updateCustomerQuery = knex('customer').where('id', '=', id);

    if (cred.role !== 'admin' && !R.contains(id, customers)) {
      updateCustomerQuery.whereIn('id', customers);
    }

    return updateCustomerQuery.update(patch).toString();
  },
  selectCustomer: id =>
    knex('customer')
      .where('id', id)
      .toString(),
  selectCustomerByName: (cred, name) => {
    const {
      customers,
      // role
    } = cred.permissions;

    const getCustomerQuery = knex('customer').where('name', '=', name);

    if (cred.role !== 'admin') {
      getCustomerQuery.whereIn('id', customers);
    }

    return getCustomerQuery.toString();
  },
  selectCustomerIdByName: name =>
    knex('customer')
      .where('name', '=', name)
      .select('id')
      .toString(),
  selectCustomerNames: () =>
    knex('customer')
      .select('name')
      .toString(),
  truncateCustomer: () =>
    knex('customer')
      .truncate()
      .toString(),
};

const Helpers = {
  getCustomerById: async (sqlClient, id) => {
    const rows = await query(sqlClient, Sql.selectCustomer(id));
    return R.prop(0, rows);
  },
  getCustomerIdByName: async (sqlClient, name) => {
    const cidResult = await query(sqlClient, Sql.selectCustomerIdByName(name));

    const amount = R.length(cidResult);
    if (amount > 1) {
      throw new Error(
        `Multiple customer candidates for '${name}' (${amount} found). Do nothing.`,
      );
    }

    if (amount === 0) {
      throw new Error(`Not found: '${name}'`);
    }

    const cid = R.path(['0', 'id'], cidResult);

    return cid;
  },
  getAllCustomerNames: async (sqlClient) =>
    await query(sqlClient, Sql.selectCustomerNames()),
};

const updateSearchGuardWithCustomers = async ({ sqlClient, searchguardClient }) => {
  const customerNames = await Helpers.getAllCustomerNames(sqlClient);

  const tenants = R.reduce(
    (acc, elem) => {
      acc[R.prop('name', elem)] = 'RW';
      return acc;
    },
    { admin_tenant: 'RW' },
    customerNames,
  );

  try {
    // Create or Update the lagoonadmin role which has access to all tenants (all customers)
    await searchguardClient.put('roles/lagoonadmin', {
      body: {
        cluster: ['UNLIMITED'],
        indices: {
          '*': {
            '*': ['UNLIMITED'],
          },
        },
        tenants,
      },
    });
  } catch (err) {
    logger.error(`SearchGuard Error while creating lagoonadmin role: ${err}`);
    throw new Error(
      `SearchGuard Error while creating lagoonadmin role: ${err}`,
    );
  }
};

const addCustomer = ({ sqlClient, searchguardClient }) => async (
  cred,
  input,
) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    `CALL CreateCustomer(
        :id,
        :name,
        ${input.comment ? ':comment' : 'NULL'},
        ${input.privateKey ? ':private_key' : 'NULL'}
      );
    `,
  );
  const rows = await query(sqlClient, prep(input));
  const customer = R.path([0, 0], rows);

  await updateSearchGuardWithCustomers({ sqlClient, searchguardClient });

  return customer;
};

const getCustomerByProjectId = ({ sqlClient }) => async (cred, pid) => {
  const { customers, projects } = cred.permissions;
  const str = `
      SELECT
        c.id,
        c.name,
        c.comment,
        c.private_key,
        c.created
      FROM project p
      JOIN customer c ON p.customer = c.id
      WHERE p.id = :pid
      ${ifNotAdmin(
    cred.role,
    `AND (${inClauseOr([['c.id', customers], ['p.id', projects]])})`,
  )}
    `;
  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep({ pid }));
  return rows ? rows[0] : null;
};

const deleteCustomer = ({ sqlClient, searchguardClient }) => async (
  cred,
  input,
) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  const prep = prepare(sqlClient, 'CALL deleteCustomer(:name)');

  await query(sqlClient, prep(input));

  await updateSearchGuardWithCustomers({ sqlClient, searchguardClient });

  // TODO: maybe check rows for changed values
  return 'success';
};

const getAllCustomers = ({ sqlClient }) => async (cred, args) => {
  const where = whereAnd([
    args.createdAfter ? 'created >= :created_after' : '',
    ifNotAdmin(cred.role, `${inClause('id', cred.permissions.customers)}`),
  ]);
  const prep = prepare(sqlClient, `SELECT * FROM customer ${where}`);
  const rows = await query(sqlClient, prep(args));
  return rows;
};

const updateCustomer = ({ sqlClient }) => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const cid = input.id.toString();

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateCustomer(cred, input));
  const rows = await query(sqlClient, Sql.selectCustomer(cid));

  return R.prop(0, rows);
};

const getCustomerByName = ({ sqlClient }) => async (cred, args) => {
  const rows = await query(
    sqlClient,
    Sql.selectCustomerByName(cred, args.name),
  );
  return rows ? rows[0] : null;
};

const deleteAllCustomers = ({ sqlClient }) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateCustomer());

  // TODO: Check rows for success
  return 'success';
};

module.exports = {
  Sql,
  Queries: {
    addCustomer,
    deleteCustomer,
    getAllCustomers,
    getCustomerByProjectId,
    updateCustomer,
    getCustomerByName,
    deleteAllCustomers,
  },
  Helpers,
};
