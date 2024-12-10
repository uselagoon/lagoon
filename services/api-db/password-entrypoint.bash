#!/usr/bin/env bash

set -eo pipefail

if [ ${API_DB_PASSWORD+x} ]; then
    if [ "${LAGOON}" == "mysql" ]; then
        export MYSQL_PASSWORD=${API_DB_PASSWORD}
    else
        export MARIADB_PASSWORD=${API_DB_PASSWORD}
    fi
fi