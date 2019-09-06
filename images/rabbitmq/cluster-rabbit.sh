#!/bin/sh

# Replace placeholders with ENV values and copy file to rabbitmq conf directory from ConfigMap
if [ -e /etc/rabbitmq/definitions.json ]; then
	/bin/ep /etc/rabbitmq/definitions.json
fi

# start the server
docker-entrypoint.sh rabbitmq-server
