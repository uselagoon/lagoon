#!/usr/bin/env bash

set -e
set -x

gotpl "/etc/gotpl/my.cnf.tpl" > "/etc/mysql/my.cnf"

if [ ! -d "/var/lib/mysql/mysql" ]; then
	echo "Configure first time mysql"
	/usr/local/bin/configure-mysql.sh
fi

exec mysqld
#exec bash
