#!/usr/bin/env bash

curl -XPUT "http://logs-db:9200/_xpack/watcher/watch/rabbitmq_connection_error" -H 'Content-Type: application/json' -d @rabbitmq_connection_error.json
