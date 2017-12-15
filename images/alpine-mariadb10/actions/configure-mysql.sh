#!/bin/bash
#
# Adfinis SyGroup AG
# openshift-mariadb-galera: mysql setup script
#

set -eox pipefail

echo 'Running mysql_install_db ...'
mysql_install_db --datadir=/var/lib/mysql
echo 'Finished mysql_install_db'

mysqld --skip-networking --socket=/tmp/mysql-init.sock --wsrep_on=OFF &
pid="$!"

mysql=( mysql --protocol=socket -uroot -hlocalhost --socket=/tmp/mysql-init.sock )

for i in {30..0}; do
  if echo 'SELECT 1' | "${mysql[@]}" &> /dev/null; then
    break
  fi
  echo 'MySQL init process in progress...'
  sleep 1
done
if [ "$i" = 0 ]; then
  echo >&2 'MySQL init process failed.'
  exit 1
fi

if [ -z "$MYSQL_INITDB_SKIP_TZINFO" ]; then
	# sed is for https://bugs.mysql.com/bug.php?id=20545
	mysql_tzinfo_to_sql /usr/share/zoneinfo | sed 's/Local time zone must be set--see zic manual page/FCTY/' | "${mysql[@]}" mysql
fi

# add MariaDB root user
"${mysql[@]}" <<-EOSQL
-- What's done in this file shouldn't be replicated
--  or products like mysql-fabric won't work
SET @@SESSION.SQL_LOG_BIN=0;

DELETE FROM mysql.user ;
CREATE USER 'root'@'%' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}' ;
GRANT ALL ON *.* TO 'root'@'%' WITH GRANT OPTION ;
DROP DATABASE IF EXISTS test ;
FLUSH PRIVILEGES ;
EOSQL

# add root password for subsequent calls to mysql
if [ ! -z "$MYSQL_ROOT_PASSWORD" ]; then
	mysql+=( -p"${MYSQL_ROOT_PASSWORD}" )
fi

# add users require for Galera
# TODO: make them somehow configurable
"${mysql[@]}" <<-EOSQL
CREATE USER 'xtrabackup_sst'@'localhost' IDENTIFIED BY 'xtrabackup_sst' ;
GRANT RELOAD, LOCK TABLES, REPLICATION CLIENT ON *.* TO 'xtrabackup_sst'@'localhost' ;
CREATE USER 'readinessProbe'@'localhost' IDENTIFIED BY 'readinessProbe';
EOSQL

if [ "$MYSQL_DATABASE" ]; then
	echo "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` ;" | "${mysql[@]}"
	mysql+=( "$MYSQL_DATABASE" )
fi

if [ "$MYSQL_USER" -a "$MYSQL_PASSWORD" ]; then
	echo "CREATE USER '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD' ;" | "${mysql[@]}"

	if [ "$MYSQL_DATABASE" ]; then
		echo "GRANT ALL ON \`$MYSQL_DATABASE\`.* TO '$MYSQL_USER'@'%' ;" | "${mysql[@]}"
	fi

	echo 'FLUSH PRIVILEGES ;' | "${mysql[@]}"
fi

if ! kill -s TERM "$pid" || ! wait "$pid"; then
	echo >&2 'MySQL init process failed.'
	exit 1
fi

echo
echo 'MySQL init process done. Ready for start up.'
echo
