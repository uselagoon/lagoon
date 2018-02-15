FROM amazeeio/php:7.1-cli-drupal

ENV WEBROOT=docroot \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_CACHE_DIR=/tmp/.composer/cache

RUN apk update \
    && apk del nodejs nodejs-current yarn \
    && apk add nodejs-npm patch rsync --update-cache --repository http://dl-3.alpinelinux.org/alpine/v3.7/main/ \
    && rm -rf /var/cache/apk/*

# Add common drupal config.
RUN mkdir /bay
COPY docker/services.yml /bay
COPY docker/settings.php /bay
