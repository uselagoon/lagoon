#!/bin/sh
set -eu
echo "Waiting until $DB_ADDR is ready"
until nc -vzw5 "$DB_ADDR" 3306; do
    sleep 1
done
