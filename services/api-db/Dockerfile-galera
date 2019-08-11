ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/mariadb-galera

ENV MARIADB_DATABASE=infrastructure \
    MARIADB_USER=api \
    MARIADB_PASSWORD=api

COPY ./docker-entrypoint-initdb.d/*.sql /docker-entrypoint-initdb.d/
RUN chown -R mysql /docker-entrypoint-initdb.d/; /bin/fix-permissions /docker-entrypoint-initdb.d/
COPY ./rerun_initdb.sh /rerun_initdb.sh
