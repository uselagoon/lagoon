// @flow

const createKeycloakClient = require('keycloak-admin-client');
const logger = require('../logger');

/* ::

type WaitForKeycloakArgs = {
  baseUrl?: string,
  username?: string,
  password?: string,
  grant_type?: string,
  client_id?: string,
  realmName?: string,
  accessToken?: string,
};

*/

async function waitForKeycloak(settings /* : WaitForKeycloakArgs */) {
  let displayWaitingMessage = true;
  let keycloakClient;
  let keycloakReady = false;

  do {
    try {
      keycloakClient = await createKeycloakClient(settings);
      keycloakReady = true;
    } catch (err) {
      if (displayWaitingMessage) {
        logger.debug('Waiting for Keycloak to start...');
        displayWaitingMessage = false;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } while (!keycloakReady);

  if (!keycloakClient) {
    throw new Error('Keycloak client not initialized!');
  }

  return keycloakClient;
}

module.exports = waitForKeycloak;
