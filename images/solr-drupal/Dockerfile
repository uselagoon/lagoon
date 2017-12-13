ARG SOLR_MAJ_MIN_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM ${IMAGE_REPO:-lagoon}/solr:${SOLR_MAJ_MIN_VERSION}
ARG SOLR_MAJ_MIN_VERSION

MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home/.bashrc /home/.bashrc

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

COPY solr${SOLR_MAJ_MIN_VERSION} /solr-conf

RUN mkdir -p /opt/solr/server/solr/mycores/

COPY docker-entrypoint /lagoon/entrypoints/70-solr-entrypoint

USER root

RUN fix-permissions /opt/solr \
    && fix-permissions /opt/docker-solr \
    && fix-permissions /solr-conf

ENTRYPOINT ["/lagoon/entrypoints.sh"]

CMD ["solr-precreate", "drupal", "/solr-conf"]
