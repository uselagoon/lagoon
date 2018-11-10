// @flow

const R = require('ramda');
const searchguardClient = require('../../clients/searchguardClient');
const sqlClient = require('../../clients/sqlClient');
const {
  ifNotAdmin,
  inClause,
  inClauseOr,
  isPatchEmpty,
  prepare,
  query,
  whereAnd,
} = require('../../util/db');
const logger = require('../../logger');
const Helpers = require('./helpers');
const Sql = require('./sql');
const SearchguardOperations = require('./searchguard');

/* ::

import type {ResolversObj} from '../';

*/


const addCustomer = async (root, { input }, { credentials: { role } }) => {
  if (role !== 'admin') {
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

  await SearchguardOperations.createOrUpdateLagoonadminRole();

  return customer;
};

const getCustomerByProjectId = async (
  { id: pid },
  args,
  {
    credentials,
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
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
    role,
    `AND (${inClauseOr([['c.id', customers], ['p.id', projects]])})`,
  )}
    `;
  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep({ pid }));

  const filtered = rows ? Helpers.filterRestrictedData(credentials, rows) : [null];

  return filtered[0];
};

const deleteCustomer = async (root, { input }, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized');
  }
  const prep = prepare(sqlClient, 'CALL deleteCustomer(:name)');

  await query(sqlClient, prep(input));

  await SearchguardOperations.createOrUpdateLagoonadminRole();

  // TODO: maybe check rows for changed values
  return 'success';
};

const getAllCustomers = async (
  root,
  args,
  {
    credentials,
    credentials: {
      role,
      permissions: { customers },
    },
  },
) => {
  const where = whereAnd([
    args.createdAfter ? 'created >= :created_after' : '',
    ifNotAdmin(role, `${inClause('id', customers)}`),
  ]);
  const prep = prepare(sqlClient, `SELECT * FROM customer ${where}`);
  const rows = await query(sqlClient, prep(args));
  return Helpers.filterRestrictedData(credentials, rows);
};

const updateCustomer = async (
  root,
  { input },
  {
    credentials,
    credentials: {
      role,
    },
  },
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const cid = input.id.toString();

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(
    sqlClient,
    Sql.updateCustomer(
      credentials,
      input,
    ),
  );

  const rows = await query(sqlClient, Sql.selectCustomer(cid));

  return R.prop(0, rows);
};

const getCustomerByName = async (
  root,
  args,
  { credentials },
) => {
  const rows = await query(
    sqlClient,
    Sql.selectCustomerByName(
      credentials,
      args.name,
    ),
  );

  const filtered = rows ? Helpers.filterRestrictedData(credentials, rows) : [null];

  return filtered[0];
};

const resyncCustomersWithSearchguard = async (root, args, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await SearchguardOperations.createOrUpdateLagoonadminRole();

  return 'success';
};

const deleteAllCustomers = async (root, args, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateCustomer());

  // TODO: Check rows for success
  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  addCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerByProjectId,
  updateCustomer,
  getCustomerByName,
  deleteAllCustomers,
  resyncCustomersWithSearchguard,
};

module.exports = Resolvers;
