// ATTENTION:
// The `sqlClient` part is usually curried in our application
// This file exposes a make function to easily interact with
// our data access functions.

// The logic is split by domain model, that means that each
// domain model has its own module / file.

// A WORD ABOUT DB SECURITY:
// ---
// We are heavily relying on building manual SQL strings,
// so of course, there is a certain risk of SQL injections.
// We try to tackle this issue by using prepared statements and
// input validation via GraphQL schema.
//
// So whenever you are writing new functions, ask yourself:
// - Am I passing in unvalidated input?
// - Is the user capable of injecting sql code via the cred object?
// - Even as an api developer, is it possible to pass in malicious SQL code?
//
// We will progressively iterate on security here, there are multiple
// ways to make this module more secure, e.g.:
// - Create higher order validation functions for args / cred and
//   apply those to the later exported daoFns
// - Use a sql-string builder, additionally with our prepared statements.
//   Currently we are playing around with `knex` as our sql-builder library

const R = require('ramda');

const { ifNotAdmin, query, prepare } = require('./utils');

const getPermissions = ({ sqlClient }) => async (args) => {
  const prep = prepare(
    sqlClient,
    'SELECT user_id, projects, customers FROM permission WHERE user_id = :user_id',
  );
  const rows = await query(sqlClient, prep(args));

  return R.propOr(null, 0, rows);
};

const truncateTable = ({ sqlClient }) => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { tableName } = args;

  const prep = prepare(sqlClient, `TRUNCATE table \`${tableName}\``);

  await query(sqlClient, prep(args));

  // TODO: Check rows for success
  return 'success';
};

const daoFns = {
  getPermissions,
  truncateTable,
  ...require('./environment').Queries,
  ...require('./notification').Queries,
  ...require('./openshift').Queries,
  ...require('./customer').Queries,
  ...require('./project').Queries,
  ...require('./sshKey').Queries,
};

// Maps all dao functions to given sqlClient
// "make" is the FP equivalent of `new Dao()` in OOP
// sqlClient: the mariadb client instance provided by the node-mariadb module
const make = (sqlClient, esClient) =>
  R.map(fn => fn({ sqlClient, esClient }), daoFns);

module.exports = {
  ...daoFns,
  make,
  ifNotAdmin,
};
