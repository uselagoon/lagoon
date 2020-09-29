ARG UPSTREAM_REPO
FROM ${UPSTREAM_REPO:-uselagoon}/php-7.3-cli-drupal

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app

ENV WEBROOT=web
