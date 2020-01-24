// @flow
const got = require('got');

const { HARBOR_ADMIN_PASSWORD } = process.env;

const lagoonHarborRoute = R.compose(
  R.defaultTo('http://172.17.0.1:8084'),
  R.find(R.test(/harbor-nginx/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES'),
)(process.env);

// Test to see if we have a local harbor or not
// curl 172.17.0.1:8084; if 200: use that. if not, use harbor-nginx?
const harborClient = got.extend({
  baseUrl: `${lagoonHarborRoute || 'http://172.17.0.1:8084'}/api/`,
  json: true,
  auth: `admin:${HARBOR_ADMIN_PASSWORD || 'admin'}`,
});

module.exports = harborClient;