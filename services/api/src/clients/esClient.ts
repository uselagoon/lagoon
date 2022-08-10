import { Client } from 'elasticsearch';
import { getConfigFromEnv } from '../util/config';

export const config = {
  host: getConfigFromEnv('ELASTICSEARCH_URL', 'http://opensearch:9200'),
  user: 'admin',
  pass: getConfigFromEnv('LOGSDB_ADMIN_PASSWORD', 'admin')
};

export const esClient = new Client({
  host: config.host,
  httpAuth: `${config.user}:${config.pass}`,
  log: 'warning'
});
