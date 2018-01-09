ARG PHP_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${PHP_VERSION}-cli

MAINTAINER amazee.io
ENV LAGOON=cli-drupal

RUN curl -L -o /usr/local/bin/drupal https://github.com/hechoendrupal/drupal-console-launcher/releases/download/1.0.2/drupal.phar \
    && echo "f458e13dfb4e33c1296435dcedb7d4ca56d5027d3b7461c3114a932d434553dc563bf835f8090e9d2037b29a9f605e9bdef0e920a73b4e865f3eef82dbf5a4ff  /usr/local/bin/drupal" | sha512sum \
    && chmod +x /usr/local/bin/drupal \
    && php -d memory_limit=-1 /usr/local/bin/composer global require drush/drush \
    && mkdir -p /home/.drush

COPY drushrc.php /home/.drush/drushrc.php

RUN fix-permissions /home/.drush