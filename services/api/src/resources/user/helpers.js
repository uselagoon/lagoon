// @flow

const { query } = require('../../util/db');
const sqlClient = require('../../clients/sqlClient');
const KeycloakOperations = require('./keycloak');
const Sql = require('./sql');

const Helpers = {
  getKeycloakUserIdByUsername: async (username /* : string */) =>
    KeycloakOperations.findUserIdByUsername(username),
  getUsersByCustomerId: async (id /* : number */) =>
    query(sqlClient, Sql.selectUsersByCustomerId({ customerId: id })),
};

module.exports = Helpers;
