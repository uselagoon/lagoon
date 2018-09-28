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
  let keycloakClient;
  let keycloakReady = false;

  keycloakClient = new KeycloakAdminClient(connectionSettings);

  do {
    try {
      await keycloakClient.auth(userSettings);
      const realm = await keycloakClient.realms.findOne({realm: 'lagoon'});
      if (!realm) {
        throw new Error('lagoon realm not existing')
      }
      keycloakReady = true;
    } catch (err) {
      logger.debug(`Waiting for Keycloak to start... (error was ${err})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } while (!keycloakReady);

  setInterval(async () => await keycloakClient.auth(userSettings), 55*1000);

  if (!keycloakClient) {
    throw new Error('Keycloak client not initialized!');
  }

  logger.debug('Connected to Keycloak');

  return keycloakClient;
}

module.exports = waitAndInitKeycloak;
