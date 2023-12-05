#!/bin/sh

# set the correct permissions on the erlang cookie in case Kubernetes changed it
if [ -e /var/lib/rabbitmq/.erlang.cookie ]; then
  echo "setting .erlang.cookie permission correctly"
	chmod 400 /var/lib/rabbitmq/.erlang.cookie
fi

# Replace ENV values in definitions.json
if [ -e /etc/rabbitmq/definitions.json ]; then
	/bin/ep /etc/rabbitmq/definitions.json
fi

# Replace ENV values in definitions.json
if [ -e /etc/rabbitmq/rabbitmq.conf ]; then
	/bin/ep /etc/rabbitmq/rabbitmq.conf
fi

# Check if the container runs in Kubernetes/OpenShift
if [ -z "$POD_NAMESPACE" ]; then
  # Single container runs in docker
  echo "running in Docker, spin up single node"
else
  # Single container runs in kubernetes
  echo "running in Kubernetes, spin up single node"
fi

# start the server
docker-entrypoint.sh rabbitmq-server
