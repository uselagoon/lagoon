ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/mariadb

ENV MARIADB_DATABASE=infrastructure \
    MARIADB_USER=api \
    MARIADB_PASSWORD=api

COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d/
COPY ./rerun_initdb.sh /rerun_initdb.sh
