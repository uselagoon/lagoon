import { logger } from '../loggers/logger';
const { getKeycloakAdminClient } = require('../clients/keycloak-admin');

async function waitForKeycloak() {
  let keycloakReady = false;
  let keycloakAdminClient;

  do {
    try {
      keycloakAdminClient = await getKeycloakAdminClient();

      if (!(await keycloakAdminClient.realms.findOne({ realm: 'lagoon' }))) {
        throw new Error('The "lagoon" realm has not been created yet.');
      }

      const clients = await keycloakAdminClient.clients.find({ clientId: 'api' });
      if (!clients.length) {
        throw new Error('The "api" client has not been created yet.');
      }

      keycloakReady = true;
    } catch (err) {
      logger.debug(`Waiting for Keycloak to start... (error was ${err})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } while (!keycloakReady);

  if (!keycloakAdminClient) {
    throw new Error('Keycloak client not initialized!');
  }

  logger.debug('Connected to Keycloak');
}

module.exports = waitForKeycloak;
