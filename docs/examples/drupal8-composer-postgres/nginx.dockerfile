ARG CLI_IMAGE
FROM ${CLI_IMAGE} as builder

FROM amazeeio/nginx-drupal

COPY --from=builder /app /app

# Define where the Drupal Root is located
ENV WEBROOT=web
