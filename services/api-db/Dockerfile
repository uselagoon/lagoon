ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/mariadb-10.6:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

USER root

# replace the generate-env script with our password, since generate-env only adds a domain which isnt valid in this image
COPY password-entrypoint.bash /lagoon/entrypoints/55-generate-env.sh

USER mysql

ENV MARIADB_DATABASE=infrastructure \
    MARIADB_USER=api \
    MARIADB_PASSWORD=api \
    MARIADB_CHARSET=utf8 \
    MARIADB_COLLATION=utf8_general_ci
