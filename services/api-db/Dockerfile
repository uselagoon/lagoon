ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/mariadb-10.6:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

USER root
RUN apk add --no-cache openssh-keygen

COPY ./legacy-migration-scripts/* /legacy-migration-scripts/
RUN chown -R mysql /legacy-migration-scripts/ \
    && /bin/fix-permissions /legacy-migration-scripts/

RUN sed -i 's/mariadb-init-complete/startup-init-complete/g' /lagoon/entrypoints/9999-mariadb-init.bash

USER mysql

ENV MARIADB_DATABASE=infrastructure \
    MARIADB_USER=api \
    MARIADB_PASSWORD=api \
    MARIADB_CHARSET=utf8 \
    MARIADB_COLLATION=utf8_general_ci

COPY ./rerun_initdb.sh /rerun_initdb.sh
COPY ./legacy_rerun_initdb.sh /legacy_rerun_initdb.sh
