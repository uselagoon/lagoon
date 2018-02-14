#!/bin/bash
#
# Adfinis SyGroup AG
# openshift-mariadb-galera: Container entrypoint
#


#!/usr/bin/env bash

set -e
set -x
set -eo pipefail

if [ ! -d "/run/mysqld" ]; then
	mkdir -p /run/mysqld
	chown -R mysql:mysql /run/mysqld
fi

# Locations
CONTAINER_SCRIPTS_DIR="/usr/share/container-scripts/mysql"
EXTRA_DEFAULTS_FILE="/var/lib/mysql/.conf.d/galera.cnf"

# Check if the container runs in Kubernetes/OpenShift
if [ -z "$POD_NAMESPACE" ]; then
	# Single container runs in docker
	echo "POD_NAMESPACE not set, spin up single node"
else
	# Is running in Kubernetes/OpenShift, so find all other pods
	# belonging to the namespace
	echo "Galera: Finding peers"
	K8S_SVC_NAME=$(hostname -f | cut -d"." -f2)
	echo "Using service name: ${K8S_SVC_NAME}"
  mkdir -p /var/lib/mysql/.conf.d/
	# copy the pristine version to the one that can be edited
	cp ${CONTAINER_SCRIPTS_DIR}/galera.cnf ${EXTRA_DEFAULTS_FILE}
	/usr/bin/peer-finder -on-start="${CONTAINER_SCRIPTS_DIR}/configure-galera.sh" -service=${K8S_SVC_NAME}
fi

if [ "${1:0:1}" = '-' ]; then
	set -- mysqld "$@"
fi

wantHelp=
for arg; do
	case "$arg" in
		-'?'|--help|--print-defaults|-V|--version)
			wantHelp=1
			break
			;;
	esac
done



if [ "$1" = 'mysqld' -a -z "$wantHelp" ]; then
  if [ ! -d "/run/mysqld" ]; then
  	mkdir -p /run/mysqld
  	chown -R mysql:mysql /run/mysqld
  fi

  if [ -d /var/lib/mysql/mysql ]; then
  	echo "MySQL directory already present, skipping creation"
  else
	  echo "MySQL data directory not found, creating initial DBs"

	  mysql_install_db --skip-name-resolve

	  echo "starting mysql for initdb.d import."
		#	 XXX
		/usr/bin/mysqld --wsrep-new-cluster &
    pid="$!"
    echo "pid is $pid"

    for i in {30..0}; do
			if echo 'SELECT 1' | mysql &> /dev/null; then
				break
			fi
			echo 'MySQL init process in progress...'
			sleep 1
		done

		if [ "$MARIADB_ROOT_PASSWORD" = "" ]; then
			MARIADB_ROOT_PASSWORD=`pwgen 16 1`
			echo "[i] MySQL root Password: $MARIADB_ROOT_PASSWORD"
		fi

		MARIADB_DATABASE=${MARIADB_DATABASE:-""}
		MARIADB_USER=${MARIADB_USER:-""}
		MARIADB_PASSWORD=${MARIADB_PASSWORD:-""}

		tfile=`mktemp`
    if [ ! -f "$tfile" ]; then
		    return 1
    fi

		cat << EOF > $tfile
USE mysql;
UPDATE mysql.user SET PASSWORD=PASSWORD("$MARIADB_ROOT_PASSWORD") WHERE user="root";
FLUSH PRIVILEGES;

EOF

		if [ "$MARIADB_DATABASE" != "" ]; then
		  echo "[i] Creating database: $MARIADB_DATABASE"
		  echo "CREATE DATABASE IF NOT EXISTS \`$MARIADB_DATABASE\` CHARACTER SET utf8 COLLATE utf8_general_ci;" >> $tfile
		  if [ "$MARIADB_USER" != "" ]; then
		    echo "[i] Creating user: $MARIADB_USER with password $MARIADB_PASSWORD"
			  echo "GRANT ALL ON \`$MARIADB_DATABASE\`.* to '$MARIADB_USER'@'%' IDENTIFIED BY '$MARIADB_PASSWORD';" >> $tfile
		  fi
		fi


		cat $tfile
		cat $tfile | mysql -v -u root
		rm -v -f $tfile

		for f in `ls /docker-entrypoint-initdb.d/*`; do
		  case "$f" in
		  	*.sh)     echo "$0: running $f"; . "$f" ;;
				*.sql)    echo "$0: running $f"; cat $f| tee | mysql -u root -p${MARIADB_ROOT_PASSWORD}; echo ;;
				*)        echo "$0: ignoring $f" ;;
			esac
		echo
		done

		echo "[client]" >> /var/lib/mysql/.my.cnf
		echo "database=mysql" >> /var/lib/mysql/.my.cnf
		echo "user=root" >> /var/lib/mysql/.my.cnf
		echo "password=$MARIADB_ROOT_PASSWORD"  >> /var/lib/mysql/.my.cnf

		if ! kill -s TERM "$pid" || ! wait "$pid"; then
			echo >&2 'MySQL init process failed.'
			exit 1
		fi

	fi

echo "done, now starting daemon"

fi

exec $@
