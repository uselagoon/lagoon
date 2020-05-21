#!/usr/bin/env bash

set -eo pipefail

# Locations
CONTAINER_SCRIPTS_DIR="/usr/share/container-scripts/mysql"

if [ "$(ls -A /etc/mysql/conf.d/)" ]; then
   ep /etc/mysql/conf.d/*
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

    echo "starting mysql for mysql upgrade."
    /usr/bin/mysqld --skip-networking --wsrep_on=OFF &
    pid="$!"
    echo "pid is $pid"

    for i in {30..0}; do
      if echo 'SELECT 1' | mysql -u root; then
        break
      fi
      echo 'MySQL init process in progress...'
      sleep 1
    done

    mysql_upgrade --force

    if ! kill -s TERM "$pid" || ! wait "$pid"; then
      echo >&2 'MySQL init process failed.'
      exit 1
    fi
  else
    echo "MySQL data directory not found, creating initial DBs"

    mysql_install_db --skip-name-resolve --skip-test-db --auth-root-authentication-method=normal --datadir=/var/lib/mysql --basedir=/usr

    echo "starting mysql for initdb.d import."
    /usr/bin/mysqld --skip-networking --wsrep_on=OFF &
    pid="$!"
    echo "pid is $pid"

    for i in {30..0}; do
      if echo 'SELECT 1' | mysql -u root; then
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
DROP DATABASE IF EXISTS test;
USE mysql;
ALTER USER root@localhost IDENTIFIED VIA mysql_native_password USING PASSWORD("$MARIADB_ROOT_PASSWORD");
FLUSH PRIVILEGES;

EOF

    if [ "$MARIADB_DATABASE" != "" ]; then
      echo "[i] Creating database: $MARIADB_DATABASE"
      echo "CREATE DATABASE IF NOT EXISTS \`$MARIADB_DATABASE\` ;" >> $tfile
      if [ "$MARIADB_USER" != "" ]; then
        echo "[i] Creating user: $MARIADB_USER with password $MARIADB_PASSWORD"
        echo "GRANT ALL ON \`$MARIADB_DATABASE\`.* to '$MARIADB_USER'@'%' IDENTIFIED BY '$MARIADB_PASSWORD';" >> $tfile
      fi
    fi

    if [ "$MARIADB_DATABASE" != "" ]; then

      if [ "$MARIADB_READONLY_USER" != "" ]; then
        echo "[i] Creating user: $MARIADB_READONLY_USER with password $MARIADB_READONLY_PASSWORD"
        echo "GRANT SELECT ON \`$MARIADB_DATABASE\`.* TO '$MARIADB_READONLY_USER'@'%' IDENTIFIED BY '$MARIADB_READONLY_PASSWORD';" >> $tfile
      fi
    fi

    cat $tfile
    cat $tfile | mysql -v -u root
    rm -v -f $tfile

    echo "[client]" >> /var/lib/mysql/.my.cnf
    echo "user=root" >> /var/lib/mysql/.my.cnf
    echo "password=${MARIADB_ROOT_PASSWORD}"  >> /var/lib/mysql/.my.cnf
    echo "[mysql]" >> /var/lib/mysql/.my.cnf
    echo "database=${MARIADB_DATABASE}" >> /var/lib/mysql/.my.cnf

    for f in `ls /docker-entrypoint-initdb.d/*`; do
      case "$f" in
        *.sh)     echo "$0: running $f"; . "$f" ;;
        *.sql)    echo "$0: running $f"; cat $f| envsubst | tee | mysql -u root -p${MARIADB_ROOT_PASSWORD}; echo ;;
        *)        echo "$0: ignoring $f" ;;
      esac
    echo
    done

    if ! kill -s TERM "$pid" || ! wait "$pid"; then
      echo >&2 'MySQL init process failed.'
      exit 1
    fi

  fi

echo "done, now starting daemon"

fi
