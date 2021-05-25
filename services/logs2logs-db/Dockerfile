ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/logstash-7:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

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
    ELASTICSEARCH_URL="http://logs-db-service:9200" \
    LOGSDB_ADMIN_PASSWORD=admin \
    LOGSTASH_USERNAME="username" \
    LOGSTASH_PASSWORD="password" \
    XPACK_MONITORING_ENABLED=false


EXPOSE 8080 9600

COPY entrypoints/90-logstash-enable-forward-external-logstash.sh /lagoon/entrypoints/
