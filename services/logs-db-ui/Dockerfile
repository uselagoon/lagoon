ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/kibana

COPY docker-entrypoint.sh /lagoon/entrypoints/70-kibana.sh

ENV ELASTICSEARCH_URL=http://logs-db:9200
