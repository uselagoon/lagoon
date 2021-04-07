import Client from 'mariasql';

const logger = require('../loggers/logger');

const { API_DB_PASSWORD, API_DB_HOST, API_DB_PORT, API_DB_USER, API_DB_DATABASE } = process.env;

export const getSqlClient = () => {
  // @ts-ignore
  const sqlClient = new Client({
    host: API_DB_HOST || 'api-db',
    port: API_DB_PORT || 3306,
    user: API_DB_USER || 'api',
    password: API_DB_PASSWORD || 'api',
    db: API_DB_DATABASE || 'infrastructure',
  });

  sqlClient.on('error', error => {
    logger.error(error.message);
  });

  return sqlClient;
};

module.exports = {
  getSqlClient,
};
