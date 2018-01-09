ARG PHP_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${PHP_VERSION}-fpm

MAINTAINER amazee.io
ENV LAGOON=cli

RUN apk update \
    && apk upgrade \
    && apk add git \
        mysql-client \
        unzip \
        bash \
        tini \
        openssh-client \
        rsync \
        patch \
    && apk add nodejs-current yarn --update-cache  --repository http://dl-3.alpinelinux.org/alpine/edge/main/ --repository http://dl-3.alpinelinux.org/alpine/edge/community/ \
    && rm -rf /var/cache/apk/* \
    && curl -L -o /usr/local/bin/composer https://github.com/composer/composer/releases/download/1.5.2/composer.phar \
    && echo "61dfd2f9262a0a2469e0c1864ab1cce6d3e63f9053faf883cd08307413d92119010638bfbee7c90c9b6977e284814bcb7bfdc01dd9cb9125ac947a2968c791bc  /usr/local/bin/composer" | sha512sum \
    && chmod +x /usr/local/bin/composer \
    && php -d memory_limit=-1 /usr/local/bin/composer global require hirak/prestissimo \
    && mkdir -p /home/.ssh \
    && fix-permissions /home/

# Adding Composer vendor bin path to $PATH.
ENV PATH="/home/.composer/vendor/bin:${PATH}"
# We not only use "export $PATH" as this could be overwritten again
# like it happens in /etc/profile of alpine Images.
COPY 90-composer-path.sh /lagoon/entrypoints/

# Making sure the path is not only added during entrypoint, but also when creating a new shell
RUN echo "source /lagoon/entrypoints/90-composer-path.sh" >> /home/.bashrc

# SSH Key and Agent Setup
COPY 10-ssh-agent.sh /lagoon/entrypoints/
COPY ssh_config /home/.ssh/config
ENV SSH_AUTH_SOCK=/tmp/ssh-agent

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]
