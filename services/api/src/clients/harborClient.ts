import got from 'got';
import { getConfigFromEnv, getLagoonRouteFromEnv } from '../util/config';

export const config = {
  origin: getConfigFromEnv(
    'HARBOR_URL',
    'http://harbor-harbor-core.harbor.svc.cluster.local:80'
  ),
  user: 'admin',
  pass: getConfigFromEnv('HARBOR_ADMIN_PASSWORD', 'Harbor12345'),
  // Use an empty string for backwards compatibility with Harbor version 1.x.x
  apiVersion: getConfigFromEnv('HARBOR_API_VERSION', 'v2.0'),
  get publicRoute() {
    return getLagoonRouteFromEnv(/harbor-nginx/, this.origin);
  }
};

export const harborClient = got.extend({
  baseUrl: `${config.publicRoute}/api/${
    config.apiVersion ? config.apiVersion.concat('/') : ''
  }`,
  json: true,
  auth: `${config.user}:${config.pass}`
});
