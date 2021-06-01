require('newrelic');
const { initSendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { initSendToLagoonTasks } = require('@lagoon/commons/dist/tasks');
const waitForKeycloak = require('./util/waitForKeycloak');
const { envHasConfig } = require('./util/config');
const { logger } = require('./loggers/logger');
const createServer = require('./server');

initSendToLagoonLogs();
initSendToLagoonTasks();

(async () => {

  await waitForKeycloak();

  logger.debug('Starting to boot the application.');

  try {
    if (!envHasConfig('JWTSECRET')) {
      throw new Error(
        'Required environment variable JWTSECRET is undefined or null!',
      );
    }

    if (!envHasConfig('JWTAUDIENCE')) {
      throw new Error(
        'Required environment variable JWTAUDIENCE is undefined or null!',
      );
    }

    await createServer();

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
