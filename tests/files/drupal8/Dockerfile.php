ARG BUILDER_IMAGE
FROM ${BUILDER_IMAGE:-builder} as builder

ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-php7.0-drupal

COPY --from=builder /app /app