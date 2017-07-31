ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/centos7-drupal-builder:7.0

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app
