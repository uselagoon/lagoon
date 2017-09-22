ARG PHP_VERSION
FROM php:${PHP_VERSION}-alpine

MAINTAINER amazee.io

COPY docker-sleep.sh /usr/local/bin/docker-sleep

ENV AMAZEEIO_DB_HOST=mariadb \
    AMAZEEIO_DB_PORT=3306 \
    AMAZEEIO_DB_USERNAME=drupal \
    AMAZEEIO_DB_PASSWORD=drupal \
    AMAZEEIO_SITENAME=drupal \
    AMAZEEIO_SITE_NAME=drupal \
    AMAZEEIO_SITE_ENVIRONMENT=development \
    AMAZEEIO_HASH_SALT=0000000000000000000000000 \
    AMAZEEIO_TMP_PATH=/tmp \
    AMAZEEIO_LOCATION=docker

RUN apk update \
    && apk upgrade \
    && apk add git \
        mysql-client \
        unzip \
    && apk add nodejs-current-npm yarn --update-cache  --repository http://dl-3.alpinelinux.org/alpine/edge/main/ --repository http://dl-3.alpinelinux.org/alpine/edge/community/ \
    && rm -rf /var/cache/apk/* \
    && docker-php-ext-install pdo_mysql \
    && mkdir -p /app \
    && curl -o /usr/local/bin/composer https://getcomposer.org/download/1.5.2/composer.phar \
    && echo "61dfd2f9262a0a2469e0c1864ab1cce6d3e63f9053faf883cd08307413d92119010638bfbee7c90c9b6977e284814bcb7bfdc01dd9cb9125ac947a2968c791bc  /usr/local/bin/composer" | sha512sum \
    && curl -o /usr/local/bin/drupal https://github.com/hechoendrupal/drupal-console-launcher/releases/download/1.0.2/drupal.phar \
    && echo "f458e13dfb4e33c1296435dcedb7d4ca56d5027d3b7461c3114a932d434553dc563bf835f8090e9d2037b29a9f605e9bdef0e920a73b4e865f3eef82dbf5a4ff  /usr/local/bin/drupal" | sha512sum \
    && chmod +x /usr/local/bin/docker-sleep \
        /usr/local/bin/composer \
        /usr/local/bin/drupal


WORKDIR /app

CMD ["/usr/local/bin/docker-sleep"]
