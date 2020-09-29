ARG CLI_IMAGE
ARG UPSTREAM_REPO
FROM ${CLI_IMAGE:-builder} as builder

FROM ${UPSTREAM_REPO:-uselagoon}/nginx-drupal

COPY --from=builder /app /app

ENV WEBROOT=web
