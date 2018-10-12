// @flow

const MariaSQL = require('mariasql');
const logger = require('../logger');

const sqlClient = new MariaSQL({
  host: 'api-db',
  port: 3306,
  user: 'api',
  password: 'api',
  db: 'infrastructure',
});

sqlClient.on('error', error => {
  logger.error(error);
});

module.exports = sqlClient;
