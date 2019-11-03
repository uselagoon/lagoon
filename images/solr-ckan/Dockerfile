ARG BASE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/solr:${BASE_VERSION}
ARG BASE_VERSION

COPY solr${BASE_VERSION} /solr-conf

RUN precreate-core ckan /solr-conf

CMD ["solr-foreground"]
