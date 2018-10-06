// ATTENTION:
// The `sqlClient` part is usually curried in our application
// This file exposes a make function to easily interact with
// our data access functions.

// The logic is split by domain model, that means that each
// domain model has its own module / file.

// We now use knex as our SQL query builder.
//
// Obsolete former notice:
//
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

const getPermissions = ({ sqlClient }) => async args => {
  const prep = prepare(
    sqlClient,
    'SELECT user_id, projects, customers FROM permission WHERE user_id = :user_id',
  );
  const rows = await query(sqlClient, prep(args));

  return R.propOr(null, 0, rows);
};

// TODO: Make this simpler.
// For example: Consider removing the "DAO" concept completely (including this file) and migrating to traditional resolver files which are imported directly in services/api/src/schema.js
// Example structure including SQL, schema, resolvers: https://github.com/sysgears/apollo-universal-starter-kit/tree/e2c43fcfdad8b2a4a3ca0b491bbd1493fcaee255/packages/server/src/modules/post
const daoFns = {
  getPermissions,
  ...require('./customer').Resolvers,
  ...require('./environment').Resolvers,
  ...require('./notification').Resolvers,
  ...require('./openshift').Resolvers,
  ...require('./project').Resolvers,
  ...require('./sshKey').Resolvers,
  ...require('./user').Resolvers,
};

// Maps all dao functions to given sqlClient
// "make" is the FP equivalent of `new Dao()` in OOP
// sqlClient: the mariadb client instance provided by the node-mariadb module
// esClient: the elasticsearch client instance provided by the elasticsearch module
// keycloakClient: the Keycloak client instance provided by the keycloak-admin-client module
const make = (
  sqlClient,
  esClient,
  keycloakClient,
  searchguardClient,
  kibanaClient,
) =>
  R.map(fn =>
    fn({
      sqlClient,
      esClient,
      keycloakClient,
      searchguardClient,
      kibanaClient,
    }),
  )(daoFns);

module.exports = {
  ...daoFns,
  make,
  ifNotAdmin,
};
