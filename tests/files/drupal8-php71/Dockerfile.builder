ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-php7.1-drupal-builder

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app
