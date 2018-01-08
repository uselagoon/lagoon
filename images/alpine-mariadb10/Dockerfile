FROM alpine

MAINTAINER amazee.io
ENV BACKUPS_DIR="/mnt/backups"

RUN touch /amazeeio

RUN set -xe && \
    \
    apk add --update --no-cache \
        bash \
        ca-certificates \
        curl \
        gzip \
        tar \
        unzip \
        wget \
        mariadb mariadb-common ; \
    \
    rm -rf /var/cache/apk/*

RUN set -xe; \
    mkdir -p \
        /var/run/mysqld \
        /var/lib/mysql \
        /etc/mysql \
        /docker-entrypoint-initdb.d \
        "${BACKUPS_DIR}"; \
    \
    chown -R mysql:mysql \
        /var/run/mysqld \
        /var/lib/mysql \
        /etc/mysql \
        /docker-entrypoint-initdb.d \
        "${BACKUPS_DIR}";


USER mysql

# COPY actions /usr/local/bin
# COPY templates /etc/gotpl/
COPY docker-entrypoint.sh /

RUN ls -la /usr/local/bin
RUN chmod 755 /usr/local/bin/*.sh || ls -la /usr/local/bin

RUN mkdir -p /run/mysqld || ls -la / /run

WORKDIR /var/lib/mysql
VOLUME /var/lib/mysql

EXPOSE 3306

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["mysqld"]
