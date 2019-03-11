FROM amazeeio/php:7.1-cli-drupal

ENV WEBROOT=docroot \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_CACHE_DIR=/tmp/.composer/cache

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

RUN apk update \
    && apk del nodejs nodejs-current yarn \
    && apk add nodejs-npm patch rsync --update-cache --repository http://dl-3.alpinelinux.org/alpine/v3.7/main/ \
    && rm -rf /var/cache/apk/* \
    && apk add --update jq clamav clamav-libunrar \
    && rm -rf /var/lib/clamav/daily.cvd \
    && freshclam --no-warnings || true \
    && apk del --no-cache curl \
    && apk add --no-cache "curl=7.61.1-r2" --repository http://dl-cdn.alpinelinux.org/alpine/v3.8/main/

# Add common drupal config.
RUN mkdir /bay
COPY docker/services.yml /bay
COPY docker/settings.php /bay
