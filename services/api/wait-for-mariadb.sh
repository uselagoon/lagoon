#!/bin/sh

set -eo pipefail

echo "Waiting until mariadb is ready "
until $(nc -zv api-db 3306); do
    printf '.'
    sleep 1
done
