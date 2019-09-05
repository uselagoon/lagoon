#!/bin/sh


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

# Replace placeholders with ENV values and copy file to rabbitmq conf directory from ConfigMap
if [ -e /etc/rabbitmq/definitions.json ]; then
  sed -i -e "s/REPLACE_USERNAME/${RABBITMQ_DEFAULT_USER}/g" \
	 -e "s/REPLACE_PASSWORD/${RABBITMQ_DEFAULT_PASS}/g" \
	 -e "s/REPLACE_QUEUE_PATTERN/${RABBITMQ_DEFAULT_HA_PATTERN}/g" /etc/rabbitmq/definitions.json
fi

# start the server
docker-entrypoint.sh rabbitmq-server
