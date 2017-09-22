ARG CLI_IMAGE
ARG IMAGE_REPO
FROM ${CLI_IMAGE:-builder} as builder

FROM ${IMAGE_REPO:-lagoon}/centos7-php7.0-drupal

COPY --from=builder /app /app