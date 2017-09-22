ARG PHP_VERSION
FROM php:${PHP_VERSION}-fpm-alpine

MAINTAINER amazee.io

COPY check_fcgi /usr/sbin/
COPY fix-permissions /usr/local/bin
COPY entrypoints /amazeeio/entrypoints
COPY amazeeio-entrypoints.sh /usr/sbin/amazeeio-entrypoints

COPY php-fpm.conf php.ini /etc/
COPY php-fpm.d/www.conf /etc/php-fpm.d/www.conf

RUN apk update \
    && apk upgrade \
    && apk add --no-cache fcgi \
    && rm -rf /var/cache/apk/* \
    && docker-php-ext-install pdo_mysql \
    && mkdir -p /app \
    && curl -sLo /usr/local/bin/ep https://github.com/kreuzwerker/envplate/releases/download/v0.0.8/ep-linux \
    && echo "167811f4c14976eb3468f9da1a2a153d60bb78765f4a400bb3da42be8489e21859b056305d75b90d3a2721ba686d3bb4be9fd4cba520d544412ab59634826833  /usr/local/bin/ep" | sha512sum -c \
    && chmod +x /usr/local/bin/ep \
    && chmod g+w /etc/passwd \
    && cp /amazeeio/entrypoints/50-dotenv.sh /$HOME/.bashrc \
    && fix-permissions /usr/local/etc/php-fpm.conf \
    && fix-permissions /usr/local/etc/php-fpm.d/ \
    && fix-permissions /app

EXPOSE 9000

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    BASH_ENV=/amazeeio/entrypoints/50-dotenv.sh \
    ENV=/amazeeio/entrypoints/50-dotenv.sh \
    AMAZEEIO_DB_HOST=mariadb \
    AMAZEEIO_DB_PORT=3306 \
    AMAZEEIO_DB_USERNAME=drupal \
    AMAZEEIO_DB_PASSWORD=drupal \
    AMAZEEIO_SITENAME=drupal \
    AMAZEEIO_SITE_NAME=drupal \
    AMAZEEIO_SITE_ENVIRONMENT=development \
    AMAZEEIO_HASH_SALT=0000000000000000000000000 \
    AMAZEEIO_TMP_PATH=/tmp \
    AMAZEEIO_LOCATION=docker

ENTRYPOINT ["/usr/sbin/amazeeio-entrypoints"]
CMD ["/usr/local/sbin/php-fpm", "-F", "-R"]
