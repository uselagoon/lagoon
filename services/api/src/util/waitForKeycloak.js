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

async function waitForKeycloak(
  connectionSettings /* : ConnectionSettings */,
  userSettings /* : UserSettings */,
) {
  let keycloakClient;
  let keycloakReady = false;

  do {
    try {
      keycloakClient = new KeycloakAdminClient(connectionSettings);
      await keycloakClient.auth(userSettings);
      keycloakReady = true;
    } catch (err) {
      logger.debug('Waiting for Keycloak to start...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } while (!keycloakReady);

  if (!keycloakClient) {
    throw new Error('Keycloak client not initialized!');
  }

  return keycloakClient;
}

module.exports = waitForKeycloak;
