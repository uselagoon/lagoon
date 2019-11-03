ARG IMAGE_REPO
ARG BASE_VERSION
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM docker.elastic.co/kibana/kibana:${BASE_VERSION}

LABEL maintainer="amazee.io"
ENV LAGOON=kibana

USER root

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN curl -sL https://github.com/krallin/tini/releases/download/v0.18.0/tini -o /sbin/tini && chmod a+x /sbin/tini

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

RUN fix-permissions /usr/share/kibana

# tells the local development environment on which port we are running
# ENV LAGOON_LOCALDEV_HTTP_PORT=5601

ENV NODE_OPTIONS="--max-old-space-size=200"

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.bash"]
CMD ["/bin/bash", "/usr/local/bin/kibana-docker"]
