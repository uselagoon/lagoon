ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/mariadb-10.6:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV MARIADB_DATABASE=keycloak \
    MARIADB_USER=keycloak \
    MARIADB_PASSWORD=keycloak \
    MARIADB_CHARSET=utf8 \
    MARIADB_COLLATION=utf8_general_ci

COPY my_query-cache.cnf /etc/mysql/conf.d/my_query-cache.cnf
USER root
# replace the generate-env script with our password, since generate-env only adds a domain which isnt valid in this image
COPY password-entrypoint.bash /lagoon/entrypoints/55-generate-env.sh
RUN fix-permissions /etc/mysql/conf.d/
USER mysql
