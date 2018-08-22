#!/bin/sh

INITDB_DIR="/docker-entrypoint-initdb.d"

for sql_file in `ls $INITDB_DIR`; do mysql --verbose < "$INITDB_DIR/$sql_file" ; done
