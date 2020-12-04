const got = require('got');
const R = require('ramda');

const { HARBOR_ADMIN_PASSWORD } = process.env;

const defaultHarborUrl = R.propOr('http://harbor-harbor-core.harbor.svc.cluster.local:80', 'HARBOR_URL', process.env);

const lagoonHarborRoute = R.compose(
  R.defaultTo(defaultHarborUrl),
  R.find(R.test(/harbor-nginx/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES'),
)(process.env);

const apiVersion = R.propOr('v2.0', 'HARBOR_API_VERSION', process.env);
// Use an empty string for backwards compatibility with Harbor version 1.x.x

const harborClient = got.extend({
  baseUrl: `${lagoonHarborRoute}/api/${apiVersion ? apiVersion.concat('/') : '' }`,
  json: true,
  auth: `admin:${HARBOR_ADMIN_PASSWORD || 'Harbor12345'}`,
});

module.exports = harborClient;