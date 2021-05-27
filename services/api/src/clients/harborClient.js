const got = require('got');
const R = require('ramda');

const { HARBOR_ADMIN_PASSWORD } = process.env;

const lagoonHarborRoute = R.compose(
  R.defaultTo('http://172.17.0.1:8084'),
  R.find(R.test(/harbor-nginx/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES'),
)(process.env);

const apiVersion = R.propOr('v2.0', 'HARBOR_API_VERSION', process.env);
// Use an empty string for backwards compatibility with Harbor version 1.x.x

const harborClient = got.extend({
  baseUrl: `${lagoonHarborRoute}/api/${apiVersion ? apiVersion.concat('/') : '' }`,
  json: true,
  auth: `admin:${HARBOR_ADMIN_PASSWORD || 'admin'}`,
});

module.exports = harborClient;