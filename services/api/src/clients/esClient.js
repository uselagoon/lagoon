const elasticsearch = require('elasticsearch');

const { LOGSDB_ADMIN_PASSWORD, ELASTCISEARCH_HOST } = process.env;

const esClient = new elasticsearch.Client({
  host: ELASTCISEARCH_HOST || 'logs-db-service:9200',
  log: 'warning',
  httpAuth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
});

module.exports = esClient;
