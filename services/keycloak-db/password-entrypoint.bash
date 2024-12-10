#!/usr/bin/env bash

set -eo pipefail

if [ ${KEYCLOAK_DB_PASSWORD+x} ]; then
    if [ "${LAGOON}" == "mysql" ]; then
        export MYSQL_PASSWORD=${KEYCLOAK_DB_PASSWORD}
    else
        export MARIADB_PASSWORD=${KEYCLOAK_DB_PASSWORD}
    fi
fi