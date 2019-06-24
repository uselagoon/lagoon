ARG PHP_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${PHP_VERSION}-fpm

LABEL maintainer="amazee.io"
ENV LAGOON=cli

# Defining Versions - https://getcomposer.org/download/
ENV COMPOSER_VERSION=1.8.6 \
  COMPOSER_HASH_SHA256=b66f9b53db72c5117408defe8a1e00515fe749e97ce1b0ae8bdaa6a5a43dd542

RUN apk add --no-cache git \
        unzip \
        gzip  \
        bash \
        tini \
        openssh-client \
        rsync \
        patch \
        procps \
        coreutils \
        postgresql-client \
        openssh-sftp-server \
        findutils \
    && apk add --no-cache "mariadb-client=10.2.24-r0" --repository http://dl-cdn.alpinelinux.org/alpine/v3.8/main/ \
    && apk add --no-cache nodejs-current nodejs-npm yarn --force-overwrite --repository http://dl-cdn.alpinelinux.org/alpine/edge/main/ --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/ \
    && ln -s /usr/lib/ssh/sftp-server /usr/local/bin/sftp-server \
    && rm -rf /var/cache/apk/* \
    && curl -L -o /usr/local/bin/composer https://github.com/composer/composer/releases/download/${COMPOSER_VERSION}/composer.phar \
    && echo "$COMPOSER_HASH_SHA256 /usr/local/bin/composer" | sha256sum \
    && chmod +x /usr/local/bin/composer \
    && php -d memory_limit=-1 /usr/local/bin/composer global require hirak/prestissimo \
    && mkdir -p /home/.ssh \
    && fix-permissions /home/

# Adding Composer vendor bin path to $PATH.
ENV PATH="/home/.composer/vendor/bin:${PATH}"
# We not only use "export $PATH" as this could be overwritten again
# like it happens in /etc/profile of alpine Images.
COPY 90-composer-path.sh /lagoon/entrypoints/

# Remove warning about running as root in composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# Making sure the path is not only added during entrypoint, but also when creating a new shell
RUN echo "source /lagoon/entrypoints/90-composer-path.sh" >> /home/.bashrc

# Make sure shells are not running forever
COPY 80-shell-timeout.sh /lagoon/entrypoints/
RUN echo "source /lagoon/entrypoints/80-shell-timeout.sh" >> /home/.bashrc

# Make sure xdebug is automatically enabled also for cli scripts
COPY 61-php-xdebug-cli-env.sh /lagoon/entrypoints/
RUN echo "source /lagoon/entrypoints/61-php-xdebug-cli-env.sh" >> /home/.bashrc

# helper functions
COPY 55-cli-helpers.sh /lagoon/entrypoints/
RUN echo "source /lagoon/entrypoints/55-cli-helpers.sh" >> /home/.bashrc

RUN if [ ${PHP_VERSION%.*} == "5.6" ] || [ ${PHP_VERSION%.*} == "7.0" ] ; then \
  echo echo \"PHP ${PHP_VERSION} is end of life and should no longer be used. For more information, visit https://secure.php.net/eol.php\" \> /dev/stderr >> /home/.bashrc ; fi

# SSH Key and Agent Setup
COPY 05-ssh-key.sh /lagoon/entrypoints/
COPY 10-ssh-agent.sh /lagoon/entrypoints/
COPY ssh_config /etc/ssh/ssh_config
COPY id_ed25519_lagoon_cli.key /home/.ssh/lagoon_cli.key
RUN chmod 400 /home/.ssh/lagoon_cli.key
ENV SSH_AUTH_SOCK=/tmp/ssh-agent

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]
