#!/usr/bin/env bash

set -eo pipefail

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

# check if MYSQL_COPY_DATA_DIR_SOURCE is set, if yes we're coping the contents of the given folder into the data dir folder
# this allows to prefill the datadir with a provided datadir (either added in a Dockerfile build, or mounted into the running container).
# This is different than just setting $MYSQL_DATA_DIR to the source folder, as only /var/lib/mysql is a persistent folder, so setting
# $MYSQL_DATA_DIR to another folder will make mysql to not store the datadir across container restarts, while with this copy system
# the data will be prefilled and persistent across container restarts.
if [ -n "$MYSQL_COPY_DATA_DIR_SOURCE" ]; then
  if [ -d ${MYSQL_DATA_DIR:-/var/lib/mysql}/mysql ]; then
    echo "MYSQL_COPY_DATA_DIR_SOURCE is set, but MySQL directory already present in '${MYSQL_DATA_DIR:-/var/lib/mysql}/mysql' skipping copying"
  else
    echo "MYSQL_COPY_DATA_DIR_SOURCE is set, copying datadir contents from '$MYSQL_COPY_DATA_DIR_SOURCE' to '${MYSQL_DATA_DIR:-/var/lib/mysql}'"
    CUR_DIR=${PWD}
    cd ${MYSQL_COPY_DATA_DIR_SOURCE}/; tar cf - . | (cd ${MYSQL_DATA_DIR:-/var/lib/mysql}; tar xvf -)
    cd $CUR_DIR
  fi
fi

ln -sf ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf /home/.my.cnf

if [ "$1" = 'mysqld' -a -z "$wantHelp" ]; then
  if [ ! -d "/run/mysqld" ]; then
    mkdir -p /var/run/mysqld
    chown -R mysql:mysql /var/run/mysqld
  fi

  MYSQL_INIT_WAIT_SECONDS=${MYSQL_INIT_WAIT_SECONDS:-30}
  MYSQL_INIT_PERIOD_SECONDS=${MYSQL_INIT_PERIOD_SECONDS:-1}

  if [ -d ${MYSQL_DATA_DIR:-/var/lib/mysql}/mysql ]; then
    echo "MySQL directory already present, skipping creation"

    echo "starting mysql for mysql upgrade."
    /usr/sbin/mysqld --skip-networking &
    pid="$!"
    echo "pid is $pid"

    for i in $(seq 0 $MYSQL_INIT_WAIT_SECONDS); do
      if echo 'SELECT 1' | mysql -u root; then
        break
      fi
      echo 'MySQL init process in progress...'
      sleep $MYSQL_INIT_PERIOD_SECONDS
    done

    if ! kill -s TERM "$pid" || ! wait "$pid"; then
      echo >&2 'MySQL init process failed.'
      exit 1
    fi
  else
    echo "MySQL data directory not found, creating initial DBs"

    /usr/sbin/mysqld --initialize-insecure --skip-name-resolve --datadir=${MYSQL_DATA_DIR:-/var/lib/mysql} --basedir=/usr

    echo "starting mysql for initdb.d import."
    /usr/sbin/mysqld --skip-networking &
    pid="$!"
    echo "pid is $pid"

    for i in $(seq 0 $MYSQL_INIT_WAIT_SECONDS); do
      if echo 'SELECT 1' | mysql -u root; then
        break
      fi
      echo 'MySQL init process in progress...'
      sleep $MYSQL_INIT_PERIOD_SECONDS
    done

    if [ "$MYSQL_ROOT_PASSWORD" = "" ]; then
      MYSQL_ROOT_PASSWORD=`pwgen 16 1`
      echo "[i] MySQL root Password: $MYSQL_ROOT_PASSWORD"
    fi

    MYSQL_DATABASE=${MYSQL_DATABASE:-""}
    MYSQL_USER=${MYSQL_USER:-""}
    MYSQL_PASSWORD=${MYSQL_PASSWORD:-""}

    tfile=`mktemp`
    if [ ! -f "$tfile" ]; then
        return 1
    fi

    cat << EOF > $tfile
DROP DATABASE IF EXISTS test;
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY '$MYSQL_ROOT_PASSWORD';
DELETE FROM proxies_priv WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;

EOF

    if [ "$MYSQL_DATABASE" != "" ]; then
      echo "[i] Creating database: $MYSQL_DATABASE"
      echo "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` ;" >> $tfile
      if [ "$MYSQL_USER" != "" ]; then
        echo "[i] Creating user: $MYSQL_USER with password $MYSQL_PASSWORD"
        echo "CREATE USER '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';" >> $tfile
        echo "GRANT ALL ON \`$MYSQL_DATABASE\`.* to '$MYSQL_USER'@'%';" >> $tfile
      fi
    fi


    cat $tfile
    cat $tfile | mysql -v -u root
    rm -v -f $tfile

    echo "[client]" >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf
    echo "user=root" >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf
    echo "password=${MYSQL_ROOT_PASSWORD}"  >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf
    echo "socket=/run/mysqld/mysqld.sock" >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf
    echo "[mysql]" >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf
    echo "database=${MYSQL_DATABASE}" >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf
    echo "[mysqld]" >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf
    echo "socket=/run/mysqld/mysqld.sock" >> ${MYSQL_DATA_DIR:-/var/lib/mysql}/.my.cnf

    for f in /docker-entrypoint-initdb.d/*; do
      if [ -e "$f" ]; then
        case "$f" in
          *.sh)     echo "$0: running $f"; . "$f" ;;
          *.sql)    echo "$0: running $f"; cat $f| envsubst | tee | mysql -u root -p${MYSQL_ROOT_PASSWORD}; echo ;;
          *)        echo "$0: ignoring $f" ;;
        esac
      fi
    done

    if ! kill -s TERM "$pid" || ! wait "$pid"; then
      echo >&2 'MySQL init process failed.'
      exit 1
    fi

  fi

  echo "done, now starting daemon"
  touch /tmp/startup-init-complete
  touch /tmp/mysql-init-complete

fi