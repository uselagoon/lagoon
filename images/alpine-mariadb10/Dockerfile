ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine

MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

MAINTAINER amazee.io
ENV BACKUPS_DIR="/var/lib/mysql/backup"

RUN apk add --no-cache bash mariadb-client mariadb mariadb-common pwgen && rm -rf /var/cache/apk/*

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
