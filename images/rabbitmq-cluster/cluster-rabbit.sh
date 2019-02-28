#!/bin/sh

# clustering uses full hostnames, generate those
echo NODENAME=rabbit@${HOSTNAME}.${SERVICE_NAME}.${POD_NAMESPACE}.svc.cluster.local > /etc/rabbitmq/rabbitmq-env.conf
echo cluster_formation.k8s.hostname_suffix=.${SERVICE_NAME}.${POD_NAMESPACE}.svc.cluster.local >> /etc/rabbitmq/rabbitmq.conf
echo cluster_formation.k8s.service_name=${SERVICE_NAME} >> /etc/rabbitmq/rabbitmq.conf

# start the server
docker-entrypoint.sh rabbitmq-server
