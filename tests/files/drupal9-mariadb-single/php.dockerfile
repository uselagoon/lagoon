ARG CLI_IMAGE
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${CLI_IMAGE:-builder} as builder

FROM ${UPSTREAM_REPO:-testlagoon}/php-8.1-fpm:${UPSTREAM_TAG:-latest}

COPY --from=builder /app /app
