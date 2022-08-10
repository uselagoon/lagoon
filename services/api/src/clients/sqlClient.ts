import * as mariadb from 'mariadb';
import { toNumber } from '../util/func';
import { getConfigFromEnv } from '../util/config';

export const config = {
  host: getConfigFromEnv('API_DB_HOST', 'api-db'),
  port: toNumber(getConfigFromEnv('API_DB_PORT', '3306')),
  user: getConfigFromEnv('API_DB_USER', 'api'),
  password: getConfigFromEnv('API_DB_PASSWORD', 'api'),
  database: getConfigFromEnv('API_DB_DATABASE', 'infrastructure'),
  connectionLimit: toNumber(getConfigFromEnv('API_DB_CONN_LIMIT', '10'))
};

export const sqlClientPool = mariadb.createPool(config);
