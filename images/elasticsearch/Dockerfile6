ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
# Defining Versions - https://www.elastic.co/guide/en/elasticsearch/reference/6.8/docker.html
FROM docker.elastic.co/elasticsearch/elasticsearch:6.8.2

LABEL maintainer="amazee.io"
ENV LAGOON=elasticsearch

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN curl -sL https://github.com/krallin/tini/releases/download/v0.18.0/tini -o /sbin/tini && chmod a+x /sbin/tini

COPY docker-entrypoint.sh.6 /lagoon/entrypoints/90-elasticsearch.sh

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

RUN sed -i 's/discovery.zen.minimum_master_nodes: 1//' config/elasticsearch.yml

RUN echo $'xpack.security.enabled: false\n\
\n\
node.name: "${HOSTNAME}"\n\
node.master: "${NODE_MASTER}"\n\
cluster.routing.allocation.disk.threshold_enabled: "true"\n\
discovery.zen.minimum_master_nodes: "${DISCOVERY_ZEN_MINIMUM_MASTER_NODES}"' >> config/elasticsearch.yml

RUN fix-permissions config

ENV ES_JAVA_OPTS="-Xms200m -Xmx200m" \
    DISCOVERY_ZEN_MINIMUM_MASTER_NODES=1 \
    NODE_MASTER=true

# Copy es-curl wrapper
COPY es-curl /usr/share/elasticsearch/bin/es-curl

VOLUME [ "/usr/share/elasticsearch/data" ]

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.bash"]

CMD ["/usr/local/bin/docker-entrypoint.sh"]
