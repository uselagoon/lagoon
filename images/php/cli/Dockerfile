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
        openssh-client \
        rsync \
    && apk add nodejs-current yarn --update-cache  --repository http://dl-3.alpinelinux.org/alpine/edge/main/ --repository http://dl-3.alpinelinux.org/alpine/edge/community/ \
    && rm -rf /var/cache/apk/* \
    && curl -L -o /usr/local/bin/composer https://github.com/composer/composer/releases/download/1.5.2/composer.phar \
    && echo "61dfd2f9262a0a2469e0c1864ab1cce6d3e63f9053faf883cd08307413d92119010638bfbee7c90c9b6977e284814bcb7bfdc01dd9cb9125ac947a2968c791bc  /usr/local/bin/composer" | sha512sum \
    && curl -L -o /usr/local/bin/drupal https://github.com/hechoendrupal/drupal-console-launcher/releases/download/1.0.2/drupal.phar \
    && echo "f458e13dfb4e33c1296435dcedb7d4ca56d5027d3b7461c3114a932d434553dc563bf835f8090e9d2037b29a9f605e9bdef0e920a73b4e865f3eef82dbf5a4ff  /usr/local/bin/drupal" | sha512sum \
    && chmod +x /usr/local/bin/composer \
        /usr/local/bin/drupal \
    && php -d memory_limit=-1 /usr/local/bin/composer global require hirak/prestissimo drush/drush

# Adding Composer vendor bin path to $PATH. We don't use "export $PATH" as this could be overwritten again
# like it happens in /etc/profile of alpine Images.
COPY 90-composer-path.sh /lagoon/entrypoints/

# Making sure the path is not only added during entrypoint, but also when creating a new shell
RUN echo "source /lagoon/entrypoints/90-composer-path.sh" >> /home/.bashrc

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]
