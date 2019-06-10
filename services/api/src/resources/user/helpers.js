// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const KeycloakOperations = require('./keycloak');

const Helpers = () => ({
  getKeycloakUserIdByUsername: async (username /* : string */) =>
    KeycloakOperations.findUserIdByUsername(username),
});

module.exports = Helpers;
