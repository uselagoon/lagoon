ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/logstash

# Remove default shipped pipeline
RUN rm -f pipeline/logstash.conf

COPY pipeline/ pipeline/
COPY pipelines.yml config/pipelines.yml

# https://github.com/elastic/logstash-docker/issues/64
ENV PATH_CONFIG=null

ENV RABBITMQ_HOST="rabbitmq" \
    RABBITMQ_USER="guest" \
    RABBITMQ_PASSWORD="guest" \
    ELASTICSEARCH_URL="http://logs-db:9200"
ENV XPACK_MONITORING_ELASTICSEARCH_URL=$ELASTICSEARCH_URL
