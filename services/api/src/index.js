// @flow

const elasticsearch = require('elasticsearch');
const MariaSQL = require('mariasql');
const got = require('got');

const waitAndInitKeycloak = require('./util/waitAndInitKeycloak');
const logger = require('./logger');
const createServer = require('./server');

(async () => {
  const {
    JWTSECRET,
    JWTAUDIENCE,
    LOGSDB_ADMIN_PASSWORD,
    KEYCLOAK_ADMIN_PASSWORD,
  } = process.env;

  const keycloakClient = await waitAndInitKeycloak(
    {
      baseUrl: 'http://keycloak:8080/auth',
      realmName: 'master',
    },
    {
      username: 'admin',
      password: `${KEYCLOAK_ADMIN_PASSWORD || '<password not set>'}`,
      grantType: 'password',
      clientId: 'admin-cli',
    },
  );

  const searchguardClient = got.extend({
    baseUrl: 'http://logs-db:9200/_searchguard/api/',
    json: true,
    auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
  });

  const kibanaClient = got.extend({
    baseUrl: 'http://logs-db-ui:5601/api/',
    auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
    json: true,
    headers: {
      'kbn-xsrf': 'true',
    },
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

    sqlClient.on('error', error => {
      logger.error(error);
    });

    await createServer({
      jwtSecret: JWTSECRET,
      jwtAudience: JWTAUDIENCE,
      sqlClient,
      esClient,
      keycloakClient,
      searchguardClient,
      kibanaClient,
    });

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
