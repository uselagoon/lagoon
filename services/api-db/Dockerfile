ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/mariadb

ENV MARIADB_DATABASE=infrastructure \
    MARIADB_USER=api \
    MARIADB_PASSWORD=api \
    MARIADB_CHARSET=utf8 \
    MARIADB_COLLATION=utf8_general_ci

COPY ./docker-entrypoint-initdb.d/*.sql /docker-entrypoint-initdb.d/
RUN chown -R mysql /docker-entrypoint-initdb.d/; /bin/fix-permissions /docker-entrypoint-initdb.d/
COPY ./rerun_initdb.sh /rerun_initdb.sh
