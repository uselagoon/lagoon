// @flow

const R = require('ramda');
const keycloakClient = require('../../clients/keycloakClient');
const logger = require('../../logger');

const KeycloakOperations = {
  findGroupIdByName: async (name /* : string */) =>
    R.path(
      [0, 'id'],
      await keycloakClient.groups.find({
        search: name,
      }),
    ),
  deleteGroup: async (name /* : string */) => {
    try {
      // Find the Keycloak group id with the name
      const keycloakGroupId = await KeycloakOperations.findGroupIdByName(name);

      // Delete the group
      await keycloakClient.groups.del({ id: keycloakGroupId });

      logger.debug(`Deleted Keycloak group "${name}"`);
    } catch (err) {
      logger.error(`Error deleting Keycloak group: ${err}`);
      throw new Error(`Error deleting Keycloak group: ${err}`);
    }
  },
};

module.exports = KeycloakOperations;
