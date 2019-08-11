// @flow

const elasticsearch = require('elasticsearch');

const { LOGSDB_ADMIN_PASSWORD } = process.env;

const esClient = new elasticsearch.Client({
  host: 'logs-db:9200',
  log: 'warning',
  httpAuth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
});

module.exports = esClient;
