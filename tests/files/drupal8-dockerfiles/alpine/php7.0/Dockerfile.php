ARG BUILDER_IMAGE
ARG IMAGE_REPO
FROM ${BUILDER_IMAGE:-builder} as builder

FROM ${IMAGE_REPO:-lagoon}/php:7.0-fpm-alpine

COPY --from=builder /app /app
