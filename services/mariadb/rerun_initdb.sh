#!/usr/bin/bash

for sql_file in `ls /docker-entrypoint-initdb.d`; do mysql -S /tmp/mysql.sock -uapi -papi infrastructure < $sql_file ; done
