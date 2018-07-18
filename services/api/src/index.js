const logger = require('./logger');
const createServer = require('./server');
const MariaSQL = require('mariasql');
const elasticsearch = require('elasticsearch');

(async () => {
  logger.debug('Starting to boot the application.');

  try {
    const { JWTSECRET, JWTAUDIENCE, LOGSDB_ADMIN_PASSWORD } = process.env;

    const sqlClient = new MariaSQL({
      host: 'api-db',
      port: 3306,
      user: 'api',
      password: 'api',
      db: 'infrastructure',
    });

    var esClient = new elasticsearch.Client({
      host: 'logs-db:9200',
      log: 'warning',
      httpAuth: `admin:${LOGSDB_ADMIN_PASSWORD}`
    });


    sqlClient.on('error', (error) => {
      logger.error(error);
    });

    await createServer({
      jwtSecret: JWTSECRET,
      jwtAudience: JWTAUDIENCE,
      sqlClient,
      esClient,
    });

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
