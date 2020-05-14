#!/bin/bash

for f in `ls /docker-entrypoint-initdb.d/*`; do
  case "$f" in
    *.sh)     echo "$0: running $f"; . "$f" ;;
    *.sql)    echo "$0: running $f"; cat $f| envsubst | tee | mysql --verbose; echo ;;
    *)        echo "$0: ignoring $f" ;;
  esac
echo
done