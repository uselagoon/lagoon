ARG PHP_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${PHP_VERSION}-fpm

LABEL maintainer="amazee.io"
ENV LAGOON=cli

RUN apk update \
    && apk upgrade \
    && apk add git \
        mysql-client \
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
    && apk add nodejs-current nodejs-npm yarn --update-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/main/ --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/ \
    && rm -rf /var/cache/apk/* \
    && curl -L -o /usr/local/bin/composer https://github.com/composer/composer/releases/download/1.6.5/composer.phar \
    && echo "67bebe9df9866a795078bb2cf21798d8b0214f2e0b2fd81f2e907a8ef0be3434 /usr/local/bin/composer" | sha256sum \
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

# SSH Key and Agent Setup
COPY 05-ssh-key.sh /lagoon/entrypoints/
COPY 10-ssh-agent.sh /lagoon/entrypoints/
COPY ssh_config /etc/ssh/ssh_config
COPY id_ed25519_lagoon_cli.key /home/.ssh/lagoon_cli.key
RUN chmod 400 /home/.ssh/lagoon_cli.key
ENV SSH_AUTH_SOCK=/tmp/ssh-agent

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]
