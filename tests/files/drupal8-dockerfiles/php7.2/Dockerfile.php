ARG CLI_IMAGE
ARG IMAGE_REPO
FROM ${CLI_IMAGE:-builder} as builder

FROM ${IMAGE_REPO:-lagoon}/php:7.2-fpm

COPY --from=builder /app /app
