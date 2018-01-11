ARG PHP_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${PHP_VERSION}-cli

MAINTAINER amazee.io
ENV LAGOON=cli-drupal

RUN curl -L -o /usr/local/bin/drupal https://github.com/hechoendrupal/drupal-console-launcher/releases/download/1.4.0/drupal.phar \
    && echo "db81f693aa509af76171ca3b1ed2e43655f7819c964dc6096334b719dff87271351466385845cd2195e346a66cd22d0d0c5c15e0370652d13e894737ad87f62b  /usr/local/bin/drupal" | sha512sum \
    && chmod +x /usr/local/bin/drupal \
    && php -d memory_limit=-1 /usr/local/bin/composer global require drush/drush \
    && mkdir -p /home/.drush

COPY drushrc.php /home/.drush/drushrc.php

RUN fix-permissions /home/.drush