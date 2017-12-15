#!/bin/bash
#
# Adfinis SyGroup AG
# openshift-mariadb-galera: mysqld readinessProbe
#

MYSQL_USER="readinessProbe"
MYSQL_PASS="readinessProbe"
MYSQL_HOST="localhost"

mysql --protocol=socket --socket=/var/run/mysql/mysql.sock -u${MYSQL_USER} -p${MYSQL_PASS} -h${MYSQL_HOST} -e"SHOW DATABASES;"

if [ $? -ne 0 ]; then
  exit 1
else
  exit 0
fi
