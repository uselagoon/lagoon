// @flow
const got = require('got');

const { LOGSDB_ADMIN_PASSWORD } = process.env;

const searchguardClient = got.extend({
  baseUrl: 'http://logs-db:9200/_searchguard/api/',
  json: true,
  auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
});

module.exports = searchguardClient;
