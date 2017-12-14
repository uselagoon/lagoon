#!/usr/bin/env bash

set -e

if [[ -n "${DEBUG}" ]]; then
    set -x
fi

root_password=$1
host=$2
db=$3
filepath=$4
ignore_tables=$5
nice=$6
ionice=$7

filename="dump.sql"
tmp_dir="/tmp/$RANDOM"
ignore=()

IFS=';' read -ra ADDR <<< "${ignore_tables}"
for table in "${ADDR[@]}"; do
    if echo "${table}" | grep -q "%"; then
        out=$(mysql --silent -h"${host}" -uroot -p"${root_password}" -e "SHOW TABLES LIKE '${table}'" "${db}")
        tables=(${out//$'\n'/ })

        for t in "${tables[@]}"; do
            ignore+=("--ignore-table=${db}.${t}")
        done
    else
        ignore+=("--ignore-table=${db}.${table}")
    fi
done

mkdir -p "${tmp_dir}"
cd "${tmp_dir}"
nice -n "${nice}" ionice -c2 -n "${ionice}" mysqldump --single-transaction --no-data --allow-keywords -h"${host}" -uroot -p"${root_password}" "${db}" > "${filename}"
nice -n "${nice}" ionice -c2 -n "${ionice}" mysqldump --single-transaction --no-create-info "${ignore[@]}" --allow-keywords -h"${host}" -uroot -p"${root_password}" "${db}" >> "${filename}"
gzip "${filename}"
mv "${filename}.gz" "${filepath}"
stat -c "RESULT=%s" "${filepath}"