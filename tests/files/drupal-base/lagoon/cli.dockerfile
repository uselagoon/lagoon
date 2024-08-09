ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-testlagoon}/php-8.3-cli-drupal:${UPSTREAM_TAG:-latest}


COPY composer.* /app/
COPY assets /app/assets
RUN composer install --prefer-dist --no-dev --ignore-platform-reqs --no-suggest --optimize-autoloader --apcu-autoloader
COPY . /app
RUN mkdir -p -v -m775 /app/web/sites/default/files

# Define where the Drupal Root is located
ENV WEBROOT=web
