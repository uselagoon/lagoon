ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/curator

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

COPY actions.yml curator.yml /curator/
COPY 90-generate-http-auth.sh /lagoon/entrypoints/

RUN echo "source /lagoon/entrypoints/90-generate-http-auth.sh" >> /home/.bashrc

ENV LAGOON_INDEXES="^(container-logs-|router-logs-|service-logs-|application-logs-|lagoon-logs-).*$" \
    ELASTICSEARCH_HOST=logs-db-service \
    ELASTICSEARCH_HOST_PORT=9200 \
    LOGSDB_USE_SSL=False
