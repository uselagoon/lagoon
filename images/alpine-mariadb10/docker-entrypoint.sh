#!/usr/bin/env bash

set -e

if [[ -n "${DEBUG}" ]]; then
    set -x
fi

sudo fix-permissions.sh mysql mysql /var/lib/mysql "${BACKUPS_DIR}"

gotpl "/etc/gotpl/${MARIADB_VER:0:4}/my.cnf.tpl" > "/etc/mysql/my.cnf"

init-mariadb.sh "${@}"

if [[ $1 == 'make' ]]; then
    exec "${@}" -f /usr/local/bin/actions.mk
else
    exec "${@}"
fi