ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-mariadb10

ENV MYSQL_DATABASE=infrastructure \
    MYSQL_USER=api \
    MYSQL_PASSWORD=api

COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d/
