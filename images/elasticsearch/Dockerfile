ARG IMAGE_REPO
ARG BASE_VERSION
FROM ${IMAGE_REPO:-lagoon}/commons as commons
# Defining Versions - https://www.elastic.co/guide/en/elasticsearch/reference/7.3/docker.html
FROM docker.elastic.co/elasticsearch/elasticsearch:${BASE_VERSION}

LABEL maintainer="amazee.io"
ENV LAGOON=elasticsearch

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN curl -sL https://github.com/krallin/tini/releases/download/v0.18.0/tini -o /sbin/tini && chmod a+x /sbin/tini

COPY docker-entrypoint.sh /lagoon/entrypoints/90-elasticsearch.sh

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# Reproduce behavior of Alpine: Run Bash as sh
RUN rm -f /bin/sh && ln -s /bin/bash /bin/sh

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc

RUN echo $'\n\
node.name: "${HOSTNAME}"\n\
node.master: "${NODE_MASTER}"\n\
node.data: "${NODE_DATA}"\n\
node.ingest: "${NODE_INGEST}"\n\
node.ml: "${NODE_ML}"\n\
xpack.ml.enabled: "${XPACK_ML_ENABLED}"\n\
xpack.watcher.enabled: "${XPACK_WATCHER_ENABLED}"\n\
xpack.security.enabled: "${XPACK_SECURITY_ENABLED}"\n\
processors: "${PROCESSORS}"\n\
cluster.remote.connect: "${CLUSTER_REMOTE_CONNECT}"' >> config/elasticsearch.yml

RUN fix-permissions config

ENV ES_JAVA_OPTS="-Xms400m -Xmx400m" \
    NODE_MASTER=true \
    NODE_DATA=true \
    NODE_INGEST=true \
    NODE_ML=true \
    XPACK_ML_ENABLED=true \
    XPACK_WATCHER_ENABLED=true \
    XPACK_SECURITY_ENABLED=false \
    PROCESSORS=2 \
    CLUSTER_REMOTE_CONNECT=true \
    EXTRA_OPTS=""


VOLUME [ "/usr/share/elasticsearch/data" ]

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.bash"]

CMD ["/usr/local/bin/docker-entrypoint.sh"]
