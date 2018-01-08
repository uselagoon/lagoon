ARG PHP_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM php:${PHP_VERSION}-fpm-alpine

MAINTAINER amazee.io
ENV LAGOON=php

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

COPY check_fcgi /usr/sbin/
COPY entrypoints/70-php-config.sh entrypoints/60-php-xdebug.sh entrypoints/50-ssmtp.sh /lagoon/entrypoints/

COPY php.ini /usr/local/etc/php/
COPY php-fpm.d/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY ssmtp.conf /etc/ssmtp/ssmtp.conf

RUN apk update \
    && apk upgrade \
    && apk add --no-cache fcgi \
        ssmtp \
        # for gd
        libpng-dev \
        libjpeg-turbo-dev \
        # for gettext
        gettext-dev \
        # for mcrypt
        libmcrypt-dev \
        # for soap
        libxml2-dev \
        # for xsl
        libxslt-dev \
    && apk add --no-cache --virtual .phpize-deps $PHPIZE_DEPS \
    && if [ ${PHP_VERSION%.*.*} == "7" ]; then \
        yes '' | pecl install -f apcu; \
       fi \
    && if [ ${PHP_VERSION%.*.*} == "5" ]; then \
        yes '' | pecl install -f apcu-4.0.11; \
       fi \
    && yes '' | pecl install -f redis \
    && yes '' | pecl install -f xdebug \
    && docker-php-ext-enable apcu redis xdebug \
    && docker-php-ext-configure gd --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install -j4 bcmath gd gettext mcrypt pdo_mysql shmop soap sockets opcache xsl zip \
    && sed -i '1s/^/;Intentionally disabled. Enable via setting env variable XDEBUG_ENABLE to true\n;/' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && rm -rf /var/cache/apk/* /tmp/pear/ \
    && apk del .phpize-deps \
    && mkdir -p /app \
    && fix-permissions /usr/local/etc/ \
    && fix-permissions /app \
    && fix-permissions /etc/ssmtp/ssmtp.conf

EXPOSE 9000

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

ENV LAGOON_ENVIRONMENT_TYPE=development

WORKDIR /app

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["/usr/local/sbin/php-fpm", "-F", "-R"]
