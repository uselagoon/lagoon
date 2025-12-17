#!/bin/sh
set -eu
echo "Waiting until $DB_HOST is ready"
until nc -vzw5 "$DB_HOST" "$DB_PORT"; do
    sleep 1
done
