import { logger } from '../loggers/logger';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';

export const waitForKeycloak = async () => {
  let keycloakReady = false;
  let keycloakAdminClient;

  logger.info('Waiting until keycloak is ready...');

  do {
    try {
      keycloakAdminClient = await getKeycloakAdminClient();

      if (!(await keycloakAdminClient.realms.findOne({ realm: 'lagoon' }))) {
        throw new Error('The "lagoon" realm has not been created yet.');
      }

      const clients = await keycloakAdminClient.clients.find({
        clientId: 'api'
      });
      if (!clients.length) {
        throw new Error('The "api" client has not been created yet.');
      }

      keycloakReady = true;
    } catch (err) {
      logger.verbose(`Keycloak not ready: ${err})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } while (!keycloakReady);

  if (!keycloakAdminClient) {
    throw new Error('Keycloak client not initialized!');
  }

  logger.verbose('Connected to Keycloak');
};
