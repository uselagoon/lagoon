const {
  ensureRepository,
  createCredentialsCb,
  createSignature,
} = require('./util/git');

const logger = require('./logger');
const createServer = require('./server');
const createStore = require('./createStore');

const { validateApiEnv } = require('./validate');

(async () => {
  logger.debug('Starting to boot the application.');

  try {
    const {
      JWTSECRET,
      JWTAUDIENCE,
    } process.env;

    await createServer({
      store,
      jwtSecret: JWTSECRET,
      jwtAudience: JWTAUDIENCE,
    });

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
