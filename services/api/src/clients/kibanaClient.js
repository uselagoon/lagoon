const got = require('got');
const R = require('ramda');

const { LOGSDB_ADMIN_PASSWORD } = process.env;

const KIBANA_URL = propOr(
  'http://logs-db-ui:5601/api/',
  'KIBANA_URL',
  process.env
);

const kibanaClient = got.extend({
  baseUrl: KIBANA_URL,
  auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
  json: true,
  headers: {
    'kbn-xsrf': 'true',
  },
});

module.exports = kibanaClient;
