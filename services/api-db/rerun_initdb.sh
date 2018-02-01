#!/usr/bin/bash

INITDB_DIR="/docker-entrypoint-initdb.d"

for sql_file in `ls $INITDB_DIR`; do mysql -S /run/mysqld/mysqld.sock -uapi -papi infrastructure < "$INITDB_DIR/$sql_file" ; done
