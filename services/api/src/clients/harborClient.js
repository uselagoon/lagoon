const got = require('got');
const R = require('ramda');

const { HARBOR_ADMIN_PASSWORD } = process.env;

const defaultHarborUrl = R.propOr('http://172.17.0.1:8084', 'HARBOR_URL', process.env);

const lagoonHarborRoute = R.compose(
  R.defaultTo(defaultHarborUrl),
  R.find(R.test(/harbor-nginx/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES'),
)(process.env);

const harborClient = got.extend({
  baseUrl: `${lagoonHarborRoute}/api/v2.0/`,
  json: true,
  auth: `admin:${HARBOR_ADMIN_PASSWORD || 'admin'}`,
});

module.exports = harborClient;
