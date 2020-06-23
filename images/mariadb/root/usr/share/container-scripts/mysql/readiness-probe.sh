#!/bin/bash
#
# openshift-mariadb: mysqld readinessProbe
#

mysql --defaults-file=${MARIADB_DATA_DIR:-/var/lib/mysql}/.my.cnf -e"SHOW DATABASES;"

if [ $? -ne 0 ]; then
  exit 1
else
  exit 0
fi
