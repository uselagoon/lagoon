ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/postgres-11:${UPSTREAM_TAG:-latest}
LABEL maintainer="amazee.io"

COPY docker-entrypoint-initdb.d /docker-entrypoint-initdb.d