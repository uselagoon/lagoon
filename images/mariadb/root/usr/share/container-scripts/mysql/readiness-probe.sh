#!/bin/bash
#
# openshift-mariadb: mysqld readinessProbe
#

mysql --defaults-file=/var/lib/mysql/.my.cnf -e"SHOW DATABASES;"

if [ $? -ne 0 ]; then
  exit 1
else
  exit 0
fi
