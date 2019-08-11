ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/logstash

RUN bin/logstash-plugin install logstash-input-lumberjack

# Remove default shipped pipeline
RUN rm -f pipeline/logstash.conf

COPY pipeline/ pipeline/
COPY templates/ templates/
COPY certs/ certs/
COPY pipelines.yml config/pipelines.yml

RUN fix-permissions pipeline/

# https://github.com/elastic/logstash-docker/issues/64
ENV PATH_CONFIG=null

ENV RABBITMQ_HOST="broker" \
    RABBITMQ_USER="guest" \
    RABBITMQ_PASSWORD="guest" \
    ELASTICSEARCH_URL="http://logs-db:9200" \
    LOGSDB_ADMIN_PASSWORD=admin \
    LOGSTASH_USERNAME="username" \
    LOGSTASH_PASSWORD="password" \
    XPACK_MONITORING_ELASTICSEARCH_URL="http://logs-db:9200" \
    XPACK_MONITORING_ELASTICSEARCH_USERNAME=admin \
    XPACK_MONITORING_ELASTICSEARCH_PASSWORD=admin \
    XPACK_MANAGEMENT_ELASTICSEARCH_URL="http://logs-db:9200" \
    XPACK_MANAGEMENT_ELASTICSEARCH_USERNAME=admin \
    XPACK_MANAGEMENT_ELASTICSEARCH_PASSWORD=admin


EXPOSE 8080 9600

COPY entrypoints/90-logstash-enable-forward-external-logstash.sh /lagoon/entrypoints/