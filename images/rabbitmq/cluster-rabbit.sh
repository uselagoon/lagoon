#!/bin/sh

# Replace placeholders with ENV values and copy file to rabbitmq conf directory from ConfigMap
if [ -e /etc/rabbitmq/definitions.json ]; then
  sed -i -e "s/REPLACE_USERNAME/${RABBITMQ_DEFAULT_USER}/g" \
	 -e "s/REPLACE_PASSWORD/${RABBITMQ_DEFAULT_PASS}/g" \
	 -e "s/REPLACE_QUEUE_PATTERN/${RABBITMQ_DEFAULT_HA_PATTERN}/g" /etc/rabbitmq/definitions.json
fi

# start the server
docker-entrypoint.sh rabbitmq-server
