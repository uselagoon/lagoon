// @flow

const R = require('ramda');
const { keycloakAdminClient } = require('../../clients/keycloakClient');
const logger = require('../../logger');

const KeycloakOperations = {
  findGroupIdByName: async (name /* : string */) =>
    R.path(
      [0, 'id'],
      await keycloakAdminClient.groups.find({
        search: name,
      }),
    ),
  deleteGroup: async (name /* : string */) => {
    try {
      // Find the Keycloak group id with the name
      const keycloakGroupId = await KeycloakOperations.findGroupIdByName(name);

      // Delete the group
      await keycloakAdminClient.groups.del({ id: keycloakGroupId });

      logger.debug(`Deleted Keycloak group "${name}"`);
    } catch (err) {
      logger.error(`Error deleting Keycloak group: ${err}`);
      throw new Error(`Error deleting Keycloak group: ${err}`);
    }
  },
  addGroup: async (project /* : any */) => {
    try {
      // Create a group in Keycloak named the same as the project
      const name = R.prop('name', project);
      await keycloakAdminClient.groups.create({
        name,
      });
      logger.debug(`Created Keycloak group with name "${name}"`);
    } catch (err) {
      if (err.response.status === 409) {
        logger.warn(
          `Failed to create already existing Keycloak group "${R.prop(
            'name',
            project,
          )}"`,
        );
      } else {
        logger.error(`OpendistroSecurity create role error: ${err}`);
        throw new Error(`OpendistroSecurity create role error: ${err}`);
      }
    }
  },
};

module.exports = KeycloakOperations;
