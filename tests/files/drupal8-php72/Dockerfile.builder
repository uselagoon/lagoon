ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-php7.2-drupal-builder

COPY composer.json /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app
