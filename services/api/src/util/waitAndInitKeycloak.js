// @flow

const logger = require('../logger');

/* ::

type ConnectionSettings = {
  baseUrl?: string,
  realmName?: string,
  requestConfig?: Object,
}

type UserSettings = {
  username?: string,
  password?: string,
  grantType?: string,
  clientId?: string,
};

*/

async function waitAndInitKeycloak(
  keycloakAdminClient /* : Object */,
  userSettings /* : UserSettings */,
) {
  let keycloakReady = false;

  do {
    try {
      keycloakAdminClient.setConfig({ realmName: 'master' });
      await keycloakAdminClient.auth(userSettings);

      if (!(await keycloakAdminClient.realms.findOne({ realm: 'lagoon' }))) {
        throw new Error('The "lagoon" realm has not been created yet.');
      }

      keycloakAdminClient.setConfig({ realmName: 'lagoon' });
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

  // Re-authenticate with Keycloak every 55 seconds because tokens time out after 60 seconds
  // TODO: Come up with a better solution for this (refresh token?)
  setInterval(async () => {
    keycloakAdminClient.setConfig({ realmName: 'master' });
    await keycloakAdminClient.auth(userSettings);
    keycloakAdminClient.setConfig({ realmName: 'lagoon' });
    logger.debug('Re-authenticated with Keycloak after 55 seconds');
  }, 55 * 1000);

  if (!keycloakAdminClient) {
    throw new Error('Keycloak client not initialized!');
  }

  logger.debug('Connected to Keycloak');

  return keycloakAdminClient;
}

module.exports = waitAndInitKeycloak;
