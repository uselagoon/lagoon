FROM alpine

MAINTAINER amazee.io
ENV BACKUPS_DIR="/mnt/backups"

RUN apk add --no-cache mariadb-client mariadb mariadb-common pwgen && rm -rf /var/cache/apk/*

RUN set -xe; \
    mkdir -p      /var/run/mysqld /var/lib/mysql /etc/mysql /etc/mysql/conf.d /etc/mysql/ "${BACKUPS_DIR}"; \
    chgrp -R root /var/run/mysqld /var/lib/mysql /etc/mysql /etc/mysql/conf.d /etc/mysql/ "${BACKUPS_DIR}"; \
    chmod 770     /var/run/mysqld /var/lib/mysql /etc/mysql /etc/mysql/conf.d /etc/mysql/ "${BACKUPS_DIR}";

# USER mysql

COPY docker-entrypoint.sh /
COPY my.cnf /etc/mysql/my.cnf



WORKDIR /var/lib/mysql
VOLUME /var/lib/mysql
EXPOSE 3306

ENTRYPOINT ["/docker-entrypoint.sh"]
