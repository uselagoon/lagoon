ARG SOLR_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM solr:${SOLR_VERSION}-alpine

MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home/.bashrc /home/.bashrc

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN mkdir -p /opt/solr/server/solr/mycores/
VOLUME /opt/solr/server/solr/mycores/

ADD solr${SOLR_VERSION} /solr-conf

VOLUME /opt/solr/server/solr/mycores/

ENV AMAZEEIO_AUTODISCOVERY_SOLR true

CMD ["solr-precreate", "drupal", "/solr-conf"]
