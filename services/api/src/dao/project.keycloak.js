// @flow

// TEMPORARY: Don't copy this `project.helpers`, etc file naming structure.
// This is just temporarily here to avoid the problems from the circular dependency between the `project` and `user` helpers.
//
// Eventually we should move to a better folder structure and away from the DAO structure. Example folder structure: https://github.com/sysgears/apollo-universal-starter-kit/tree/e2c43fcfdad8b2a4a3ca0b491bbd1493fcaee255/packages/server/src/modules/post

const R = require('ramda');
const logger = require('../logger');

const KeycloakOperations = {
  findGroupIdByName: async (
    keycloakClient /* : Object */,
    name /* : string */,
  ) =>
    R.path(
      [0, 'id'],
      await keycloakClient.groups.find({
        search: name,
      }),
    ),
  deleteGroup: async (keycloakClient /* : Object */, name /* : string */) => {
    try {
      // Find the Keycloak group id with the name
      const keycloakGroupId = await KeycloakOperations.findGroupIdByName(
        keycloakClient,
        name,
      );

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
