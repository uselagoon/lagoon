// @flow

const KeycloakAdminClient = require('keycloak-admin').default;
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
  connectionSettings /* : ConnectionSettings */,
  userSettings /* : UserSettings */,
) {
  let keycloakReady = false;

  const keycloakClient = new KeycloakAdminClient(connectionSettings);

  do {
    try {
      await keycloakClient.auth(userSettings);

      if (!(await keycloakClient.realms.findOne({ realm: 'lagoon' }))) {
        throw new Error('The "lagoon" realm has not been created yet.');
      }

      keycloakClient.setConfig({ realmName: 'lagoon' });
      keycloakReady = true;
    } catch (err) {
      logger.debug(`Waiting for Keycloak to start... (error was ${err})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } while (!keycloakReady);

  // Re-authenticate with Keycloak every 55 seconds because tokens time out after 60 seconds
  // TODO: Come up with a better solution for this (refresh token?)
  setInterval(async () => {
    keycloakClient.setConfig({ realmName: 'master' });
    await keycloakClient.auth(userSettings);
    keycloakClient.setConfig({ realmName: 'lagoon' });
    logger.debug('Re-authenticated with Keycloak after 55 seconds');
  }, 55 * 1000);

  if (!keycloakClient) {
    throw new Error('Keycloak client not initialized!');
  }

  logger.debug('Connected to Keycloak');

  return keycloakClient;
}

module.exports = waitAndInitKeycloak;
