ARG BUILDER_IMAGE
ARG IMAGE_REPO
FROM ${BUILDER_IMAGE:-builder} as builder

FROM ${IMAGE_REPO:-lagoon}/centos7-php7.2-drupal

COPY --from=builder /app /app
