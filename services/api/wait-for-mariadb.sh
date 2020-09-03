#!/bin/sh
set -eu
echo "Waiting until ${API_DB_HOST:-api-db} is ready"
until nc -vzw5 "${API_DB_HOST:-api-db}" 3306; do
    sleep 1
done
