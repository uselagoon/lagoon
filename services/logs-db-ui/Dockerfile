ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/kibana

COPY ./init/ /lagoon/kibana-init

RUN fix-permissions /lagoon/kibana-init

ENV ELASTICSEARCH_URL=http://logs-db:9200
