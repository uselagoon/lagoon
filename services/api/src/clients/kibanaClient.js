const got = require('got');

const { LOGSDB_ADMIN_PASSWORD } = process.env;

const kibanaClient = got.extend({
  baseUrl: 'http://logs-db-ui:5601/api/',
  auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
  json: true,
  headers: {
    'kbn-xsrf': 'true',
  },
});

module.exports = kibanaClient;
