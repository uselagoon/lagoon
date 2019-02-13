#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER ckan_datastore with encrypted password 'ckan';
    GRANT ALL PRIVILEGES ON DATABASE ckan TO ckan_datastore;
EOSQL
