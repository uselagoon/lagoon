ARG IMAGE_REPO
FROM uselagoon/php-7.2-cli-drupal

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app

ENV WEBROOT=web