// @flow
const got = require('got');

const { LOGSDB_ADMIN_PASSWORD } = process.env;

const opendistroSecurityClient = got.extend({
  baseUrl: 'http://logs-db:9200/_opendistro/_security/api/',
  json: true,
  auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
});

module.exports = opendistroSecurityClient;
