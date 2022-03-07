import got from 'got';
import { getConfigFromEnv } from '../util/config';
import { config as esClientConfig } from './esClient';

export const config = {
  origin: getConfigFromEnv('ELASTICSEARCH_URL', 'http://logs-db-service:9200')
};

export const opendistroSecurityClient = got.extend({
  baseUrl: `${config.origin}/_opendistro/_security/api/`,
  auth: `${esClientConfig.user}:${esClientConfig.pass}`,
  rejectUnauthorized: false,
  json: true
});
