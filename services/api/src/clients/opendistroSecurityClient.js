const got = require('got');

const { LOGSDB_ADMIN_PASSWORD, ELASTICSEARCH_URL } = process.env;

const opendistroSecurityClient = got.extend({
  baseUrl: `${ELASTICSEARCH_URL || 'http://logs-db-service:9200'}/_opendistro/_security/api/`,
  json: true,
  auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
});

module.exports = opendistroSecurityClient;
