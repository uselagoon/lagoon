// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const { query } = require('../../util/db');
const KeycloakOperations = require('./keycloak');
const Sql = require('./sql');

const Helpers = (sqlClient /* : MariaSQL */) => ({
  getKeycloakUserIdByUsername: async (username /* : string */) =>
    KeycloakOperations.findUserIdByUsername(username),
  getUsersByCustomerId: async (id /* : number */) =>
    query(sqlClient, Sql.selectUsersByCustomerId({ customerId: id })),
});

module.exports = Helpers;
