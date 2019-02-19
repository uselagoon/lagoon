#!/bin/sh

# copy from configmap to empty volume
cp -v /etc/rabbitmq/config/* /etc/rabbitmq/;

#erlang cookie needs to be the same on all hosts,
echo "$ERLANG_COOKIE" > /var/lib/rabbitmq/.erlang.cookie;
chmod 600 /var/lib/rabbitmq/.erlang.cookie;

# clustering uses full hostnames, generate those
echo NODENAME=rabbit@${HOSTNAME}.${SERVICE_NAME}.${POD_NAMESPACE}.svc.cluster.local > /etc/rabbitmq/rabbitmq-env.conf
echo cluster_formation.k8s.hostname_suffix=.${SERVICE_NAME}.${POD_NAMESPACE}.svc.cluster.local >> /etc/rabbitmq/rabbitmq.conf

# start the server
docker-entrypoint.sh rabbitmq-server
