#!/bin/sh

set -eo pipefail

echo "Waiting until mariadb is ready "
until $(nc -zv mariadb 3306); do
    printf '.'
    sleep 1
done