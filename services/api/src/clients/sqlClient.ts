import Client from 'mariasql';
import * as mariadb from 'mariadb';
import * as logger from '../logger';
import { toNumber } from '../util/func';
import { getConfigFromEnv } from '../util/config';

export interface ConfigFromEnv {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

export const config: ConfigFromEnv = {
  host: getConfigFromEnv('API_DB_HOST', 'api-db'),
  port: toNumber(getConfigFromEnv('API_DB_PORT', '3306')),
  user: getConfigFromEnv('API_DB_USER', 'api'),
  password: getConfigFromEnv('API_DB_PASSWORD', 'api'),
  database: getConfigFromEnv('API_DB_DATABASE', 'infrastructure'),
  connectionLimit: toNumber(getConfigFromEnv('API_DB_CONN_LIMIT', '80'))
};

export const sqlClientPool = mariadb.createPool(config);

export const getSqlClient = () => {
  // @ts-ignore
  const sqlClient = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    db: config.database
  });

  sqlClient.on('error', error => {
    logger.error(error.message);
  });

  return sqlClient;
};

module.exports = {
  getSqlClient,
  sqlClientPool
};
