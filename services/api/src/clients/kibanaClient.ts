import got from 'got';
import { getConfigFromEnv } from '../util/config';
import { config as esClientConfig } from './esClient';

export const config = {
  origin: getConfigFromEnv('KIBANA_URL', 'http://logs-db-ui:5601')
};

export const kibanaClient = got.extend({
  baseUrl: `${config.origin}/api/`,
  auth: `${esClientConfig.user}:${esClientConfig.pass}`,
  json: true,
  headers: {
    'kbn-xsrf': 'true'
  }
});
