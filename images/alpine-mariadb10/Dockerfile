FROM alpine

MAINTAINER amazee.io
ENV BACKUPS_DIR="/mnt/backups"

RUN touch /amazeeio

RUN apk add --update --no-cache bash ca-certificates curl gzip tar unzip wget && rm -rf /var/cache/apk/*
RUN apk add --update --no-cache mariadb-client mariadb mariadb-common pwgen && rm -rf /var/cache/apk/*

RUN set -xe; \
    mkdir -p      /var/run/mysqld /var/lib/mysql /etc/mysql "${BACKUPS_DIR}"; \
    chgrp -R root /var/run/mysqld /var/lib/mysql /etc/mysql "${BACKUPS_DIR}"; \
    chmod 770     /var/run/mysqld /var/lib/mysql /etc/mysql "${BACKUPS_DIR}";

# USER mysql

COPY docker-entrypoint.sh /

WORKDIR /var/lib/mysql
VOLUME /var/lib/mysql
EXPOSE 3306

ENTRYPOINT ["/docker-entrypoint.sh"]
