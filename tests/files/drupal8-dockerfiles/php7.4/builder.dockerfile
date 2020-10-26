ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-testlagoon}/php-7.4-cli-drupal:${UPSTREAM_TAG:-latest}

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app

ENV WEBROOT=web
