// @flow

const keycloakClient = require('./clients/keycloakClient');
const waitAndInitKeycloak = require('./util/waitAndInitKeycloak');
const logger = require('./logger');
const createServer = require('./server');

(async () => {
  const { JWTSECRET, JWTAUDIENCE, KEYCLOAK_ADMIN_PASSWORD } = process.env;

  await waitAndInitKeycloak(keycloakClient, {
    username: 'admin',
    password: `${KEYCLOAK_ADMIN_PASSWORD || '<password not set>'}`,
    grantType: 'password',
    clientId: 'admin-cli',
  });

  logger.debug('Starting to boot the application.');

  try {
    if (JWTSECRET == null) {
      throw new Error(
        'Required environment variable JWTSECRET is undefined or null!',
      );
    }

    if (JWTAUDIENCE == null) {
      throw new Error(
        'Required environment variable JWTAUDIENCE is undefined or null!',
      );
    }

    await createServer({
      jwtSecret: JWTSECRET,
      jwtAudience: JWTAUDIENCE,
    });

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
