ARG PHP_VERSION
ARG PHP_IMAGE_VERSION
ARG ALPINE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM php:${PHP_IMAGE_VERSION}-fpm-alpine${ALPINE_VERSION}

LABEL maintainer="amazee.io"
ENV LAGOON=php

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /sbin/tini /sbin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc

COPY check_fcgi /usr/sbin/
COPY entrypoints/70-php-config.sh entrypoints/60-php-xdebug.sh entrypoints/50-ssmtp.sh entrypoints/71-php-newrelic.sh /lagoon/entrypoints/

COPY php.ini /usr/local/etc/php/
COPY 00-lagoon-php.ini.tpl /usr/local/etc/php/conf.d/
COPY php-fpm.d/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY ssmtp.conf /etc/ssmtp/ssmtp.conf

# New Relic PHP Agent.
# Support for PHP 7.4 added in 9.4.
# @see https://docs.newrelic.com/docs/release-notes/agent-release-notes/php-release-notes/
# @see https://docs.newrelic.com/docs/agents/php-agent/getting-started/php-agent-compatibility-requirements
ENV NEWRELIC_VERSION=9.6.0.255

# Pin curl to Version 7.69.1-r0 as the current shipped one 7.67.0 has a bug, see
# https://github.com/curl/curl/issues/4624
# TODO: Remove as soon as Alpine 3.11 is shipped with a version higher than 7.67.0
RUN apk add --no-cache curl=7.69.1-r0 libcurl=7.69.1-r0 --repository http://dl-cdn.alpinelinux.org/alpine/edge/main/

RUN apk add --no-cache fcgi \
        ssmtp \
        libzip libzip-dev \
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
        libgcrypt-dev \
        # for webp
        libwebp-dev \
        postgresql-dev \
    && apk add --no-cache --virtual .phpize-deps $PHPIZE_DEPS \
    && yes '' | pecl install -f apcu \
    && yes '' | pecl install -f xdebug \
    && yes '' | pecl install -f redis-4.3.0 \
    && docker-php-ext-enable apcu redis xdebug \
    && case ${PHP_VERSION} in \
      7.4*) \
        docker-php-ext-configure gd --with-webp --with-jpeg \
        ;; \
      *) \
        docker-php-ext-configure gd --with-webp-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
        ;; \
      esac \
    && docker-php-ext-install -j4 bcmath gd gettext pdo_mysql mysqli pdo_pgsql pgsql shmop soap sockets opcache xsl zip \
    && sed -i '1s/^/;Intentionally disabled. Enable via setting env variable XDEBUG_ENABLE to true\n;/' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && rm -rf /var/cache/apk/* /tmp/pear/ \
    && apk del .phpize-deps \
    && if [ ${PHP_VERSION%.*} != "7.4" ]; then \
       mkdir -p /tmp/newrelic && cd /tmp/newrelic \
    && wget https://download.newrelic.com/php_agent/archive/${NEWRELIC_VERSION}/newrelic-php5-${NEWRELIC_VERSION}-linux-musl.tar.gz \
    && gzip -dc newrelic-php5-${NEWRELIC_VERSION}-linux-musl.tar.gz | tar --strip-components=1 -xf - \
    && NR_INSTALL_USE_CP_NOT_LN=1 NR_INSTALL_SILENT=1 ./newrelic-install install \
    && sed -i -e "s/newrelic.appname = .*/newrelic.appname = \"\${LAGOON_PROJECT:-noproject}-\${LAGOON_GIT_SAFE_BRANCH:-nobranch}\"/" /usr/local/etc/php/conf.d/newrelic.ini \
    && sed -i -e "s/;newrelic.enabled = .*/newrelic.enabled = \${NEWRELIC_ENABLED:-false}/" /usr/local/etc/php/conf.d/newrelic.ini \
    && sed -i -e "s/newrelic.license = .*/newrelic.license = \"\${NEWRELIC_LICENSE:-}\"/" /usr/local/etc/php/conf.d/newrelic.ini \
    && sed -i -e "s/;newrelic.loglevel = .*/newrelic.loglevel = \"\${NEWRELIC_LOG_LEVEL:-warning}\"/" /usr/local/etc/php/conf.d/newrelic.ini \
    && sed -i -e "s/;newrelic.daemon.loglevel = .*/newrelic.daemon.loglevel = \"\${NEWRELIC_DAEMON_LOG_LEVEL:-warning}\"/" /usr/local/etc/php/conf.d/newrelic.ini \
    && sed -i -e "s/newrelic.logfile = .*/newrelic.logfile = \"\/dev\/stdout\"/" /usr/local/etc/php/conf.d/newrelic.ini \
    && sed -i -e "s/newrelic.daemon.logfile = .*/newrelic.daemon.logfile = \"\/dev\/stdout\"/" /usr/local/etc/php/conf.d/newrelic.ini \
    && mv /usr/local/etc/php/conf.d/newrelic.ini /usr/local/etc/php/conf.d/newrelic.disable \
    && cd / && rm -rf /tmp/newrelic; \
    fi \
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

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/usr/local/sbin/php-fpm", "-F", "-R"]