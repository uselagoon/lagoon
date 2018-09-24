// @flow

const elasticsearch = require('elasticsearch');
const MariaSQL = require('mariasql');

const waitForKeycloak = require('./util/waitForKeycloak');
const logger = require('./logger');
const createServer = require('./server');

(async () => {
  const keycloakClient = await waitForKeycloak({
    baseUrl: 'http://keycloak:8080/auth',
    username: 'admin',
    password: 'admin',
    grant_type: 'password',
    client_id: 'admin-cli',
    realmName: 'lagoon',
  });

  logger.debug('Starting to boot the application.');

  try {
    const { JWTSECRET, JWTAUDIENCE, LOGSDB_ADMIN_PASSWORD } = process.env;

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

    const sqlClient = new MariaSQL({
      host: 'api-db',
      port: 3306,
      user: 'api',
      password: 'api',
      db: 'infrastructure',
    });

    const esClient = new elasticsearch.Client({
      host: 'logs-db:9200',
      log: 'warning',
      httpAuth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
    });

    sqlClient.on('error', (error) => {
      logger.error(error);
    });

    await createServer({
      jwtSecret: JWTSECRET,
      jwtAudience: JWTAUDIENCE,
      sqlClient,
      esClient,
      keycloakClient,
    });

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
