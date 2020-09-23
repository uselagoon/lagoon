ARG CLI_IMAGE
ARG IMAGE_REPO
FROM ${CLI_IMAGE:-builder} as builder

FROM uselagoon/nginx-drupal

COPY --from=builder /app /app

ENV WEBROOT=web
