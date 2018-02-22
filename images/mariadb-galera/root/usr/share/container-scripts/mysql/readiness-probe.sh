#!/bin/bash
#
# Adfinis SyGroup AG
# openshift-mariadb-galera: mysqld readinessProbe
#

exit 0

mysql --defaults-file=/var/lib/mysql/.my.cnf -e"SHOW DATABASES;"

if [ $? -ne 0 ]; then
  exit 1
else
  exit 0
fi
