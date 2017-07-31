ARG BUILDER_IMAGE
FROM ${BUILDER_IMAGE:-builder} as builder

ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/centos7-php-drupal:7.0

COPY --from=builder /app /app