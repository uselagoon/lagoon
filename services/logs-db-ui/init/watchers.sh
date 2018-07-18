#!/usr/bin/env bash

until sleep 15; curl -u "admin:$LOGSDB_ADMIN_PASSWORD" --silent 'http://logs-db:9200';
do
  curl -u "admin:$LOGSDB_ADMIN_PASSWORD" -XPUT  "http://logs-db:9200/_xpack/watcher/watch/rabbitmq_connection_error" -H 'Content-Type: application/json' -d @rabbitmq_connection_error.json
done
