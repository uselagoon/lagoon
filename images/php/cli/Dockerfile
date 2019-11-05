ARG BASE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${BASE_VERSION}-fpm

LABEL maintainer="amazee.io"
ENV LAGOON=cli

# Defining Versions - Composer
# @see https://getcomposer.org/download/
ENV COMPOSER_VERSION=1.10.1 \
  COMPOSER_HASH_SHA256=1831f266580f221189dc04d4b58d7fc50c934ffc3a0eca89ecb4a53aa44867e2

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
        mariadb-client \
        postgresql-client \
        openssh-sftp-server \
        findutils \
        nodejs-current \
        nodejs-npm \
        yarn \
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

# Copy mariadb-client configuration.
COPY 90-mariadb-envplate.sh /lagoon/entrypoints/
COPY mariadb-client.cnf /etc/my.cnf.d/
RUN fix-permissions /etc/my.cnf.d/

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
