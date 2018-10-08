// @flow

// TEMPORARY: Don't copy this `project.helpers`, etc file naming structure.
// This is just temporarily here to avoid the problems from the circular dependency between the `project` and `user` helpers.
//
// Eventually we should move to a better folder structure and away from the DAO structure. Example folder structure: https://github.com/sysgears/apollo-universal-starter-kit/tree/e2c43fcfdad8b2a4a3ca0b491bbd1493fcaee255/packages/server/src/modules/post

const { query } = require('./utils');

const KeycloakOperations = require('./user.keycloak');
const Sql = require('./user.sql');

const Helpers = {
  getKeycloakUserIdByUsername: async (
    keycloakClient /* : Object */,
    username /* : string */,
  ) => KeycloakOperations.findUserIdByUsername(keycloakClient, username),
  getUsersByCustomerId: async (sqlClient /* : Object */, id /* : number */) =>
    query(sqlClient, Sql.selectUsersByCustomerId({ customerId: id })),
};

module.exports = Helpers;
