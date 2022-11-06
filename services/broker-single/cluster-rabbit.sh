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

# Check if the container runs in Kubernetes/OpenShift
if [ -z "$POD_NAMESPACE" ]; then
  # Single container runs in docker
  echo "POD_NAMESPACE not set, spin up single node"
  exec docker-entrypoint.sh rabbitmq-server
fi

# clustering uses full hostnames, generate those
echo NODENAME=rabbit@${HOSTNAME}.${SERVICE_NAME}-headless.${POD_NAMESPACE}.svc.cluster.local > /etc/rabbitmq/rabbitmq-env.conf
echo cluster_formation.k8s.hostname_suffix=.${SERVICE_NAME}-headless.${POD_NAMESPACE}.svc.cluster.local >> /etc/rabbitmq/rabbitmq.conf
echo cluster_formation.k8s.service_name=${SERVICE_NAME}-headless >> /etc/rabbitmq/rabbitmq.conf


# start the server
docker-entrypoint.sh rabbitmq-server
