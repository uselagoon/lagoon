#!/bin/sh
set -eu
timestamp=$(date +"%Y-%m-%d %H:%M:%S")
echo "[$timestamp]: Waiting until ${API_DB_HOST:-api-db} is ready..."
until nc -zw5 "${API_DB_HOST:-api-db}" 3306; do
    sleep 1
done
