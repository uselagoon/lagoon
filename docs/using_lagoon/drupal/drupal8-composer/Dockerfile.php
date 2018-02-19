ARG CLI_IMAGE
FROM ${CLI_IMAGE} as builder

FROM amazeeio/php:7.1-fpm

COPY --from=builder /app /app
