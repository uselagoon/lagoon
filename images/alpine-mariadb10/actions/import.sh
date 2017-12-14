#!/usr/bin/env bash

set -e

if [[ -n "${DEBUG}" ]]; then
    set -x
fi

query() {
    mysql -h"${host}" -uroot -p"${root_password}" -e "${@}"
}

restore_privileges() {
    query "GRANT ALL ON \`${db}\`.* TO '${user}'@'%';"
}

user=$1
root_password=$2
host=$3
db=$4
source=$5
tmp_dir="/tmp/import"

get-archive.sh "${source}" "${tmp_dir}" "zip tgz tar.gz gz"

sql_file=$(find "${tmp_dir}" -type f -name "*.sql")
count=$(echo "${sql_file}" | wc -l | grep -Eo '[0-9]+')

if [[ "${count}" == 1 ]]; then
    query "REVOKE ALL PRIVILEGES ON \`${db}\`.* FROM '${user}'@'%';"
    query "DROP DATABASE IF EXISTS ${db};"
    query "CREATE DATABASE ${db};"

    trap 'restore_privileges' EXIT
    mysql -h"${host}" -uroot -p"${root_password}" "${db}" < "${sql_file}"

    restore_privileges
    query 'FLUSH PRIVILEGES;'

    rm -rf "${tmp_dir}"
else
    rm -rf "${tmp_dir}"
    echo >&2 "Expecting single archived .sql file, none or multiple found: ${sql_file}"
    exit 1
fi
