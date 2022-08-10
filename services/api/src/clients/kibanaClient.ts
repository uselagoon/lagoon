import got from 'got';
import { getConfigFromEnv } from '../util/config';
import { config as esClientConfig } from './esClient';

export const config = {
  origin: getConfigFromEnv('KIBANA_URL', 'http://opensearch-dashboards:5601'),
  distro: getConfigFromEnv('KIBANA_DISTRO', 'opensearch-dashboards')
};

export const kibanaClient = got.extend({
  baseUrl: `${config.origin}/api/`,
  auth: `${esClientConfig.user}:${esClientConfig.pass}`,
  rejectUnauthorized: false,
  json: true,
  headers: {
    'kbn-xsrf': 'true',
    'osd-xsrf': 'true'
  }
});
