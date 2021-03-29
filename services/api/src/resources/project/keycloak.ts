import * as R from 'ramda';
import { getKeycloakAdminClient } from '../../clients/keycloak-admin';
const logger = require('../../logger');

export const KeycloakOperations = {
  findGroupIdByName: async (name: string) => {
    const keycloakAdminClient = await getKeycloakAdminClient();

    return R.path(
      [0, 'id'],
      await keycloakAdminClient.groups.find({
        search: name,
      }),
    );
  },
  deleteGroup: async (name: string) => {
    const keycloakAdminClient = await getKeycloakAdminClient();

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
};
