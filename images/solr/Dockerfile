ARG SOLR_MAJ_MIN_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM solr:${SOLR_MAJ_MIN_VERSION}-alpine

LABEL maintainer="amazee.io"
ENV LAGOON=solr

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /sbin/tini /sbin/
COPY --from=commons /home/.bashrc /home/.bashrc

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc

# we need root for the fix-permissions to work
USER root

RUN fix-permissions /opt/solr/server/solr/mycores/ \
    && fix-permissions /opt/solr/server/logs

# solr really doesn't like to be run as root, so we define the default user agin
USER solr

COPY 10-solr-port.sh /lagoon/entrypoints/

# Define Volume so locally we get persistent cores
VOLUME /opt/solr/server/solr/mycores/

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]

CMD ["solr-precreate", "mycore"]