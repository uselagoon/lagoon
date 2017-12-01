ARG PHP_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${PHP_VERSION}-fpm

MAINTAINER amazee.io

RUN apk update \
    && apk upgrade \
    && apk add git \
        mysql-client \
        unzip \
        bash \
        tini \
    && apk add nodejs-npm yarn --update-cache  --repository http://dl-3.alpinelinux.org/alpine/edge/main/ --repository http://dl-3.alpinelinux.org/alpine/edge/community/ \
    && rm -rf /var/cache/apk/* \
    && curl -L -o /usr/local/bin/composer https://github.com/composer/composer/releases/download/1.5.2/composer.phar \
    && echo "61dfd2f9262a0a2469e0c1864ab1cce6d3e63f9053faf883cd08307413d92119010638bfbee7c90c9b6977e284814bcb7bfdc01dd9cb9125ac947a2968c791bc  /usr/local/bin/composer" | sha512sum \
    && curl -L -o /usr/local/bin/drupal https://github.com/hechoendrupal/drupal-console-launcher/releases/download/1.0.2/drupal.phar \
    && echo "f458e13dfb4e33c1296435dcedb7d4ca56d5027d3b7461c3114a932d434553dc563bf835f8090e9d2037b29a9f605e9bdef0e920a73b4e865f3eef82dbf5a4ff  /usr/local/bin/drupal" | sha512sum \
    && curl -L -o /usr/local/bin/drush https://github.com/drush-ops/drush-launcher/releases/download/0.4.2/drush.phar \
    && echo "f2c882126d51352d26504eb940029d62c04a082588f404c10cd8eabe1d5d16afe86bc63a68e951b27da2d1c7fb2c9711201d1e68bd3492a9613532db29c64aa3  /usr/local/bin/drush" | sha512sum \
    && chmod +x /usr/local/bin/composer \
        /usr/local/bin/drupal \
        /usr/local/bin/drush \
    && php -d memory_limit=-1 /usr/local/bin/composer global require hirak/prestissimo

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]
