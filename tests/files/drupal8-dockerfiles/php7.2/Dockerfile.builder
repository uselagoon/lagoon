ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:7.2-cli-drupal

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app
