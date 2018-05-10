ARG CLI_IMAGE
FROM ${CLI_IMAGE} as cli

FROM amazeeio/php:5.6-fpm

COPY --from=cli /app /app
