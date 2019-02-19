ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/rabbitmq

RUN rabbitmq-plugins --offline enable rabbitmq_peer_discovery_k8s


ADD enabled_plugins /etc/rabbitmq/enabled_plugins
ADD rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
RUN chgrp 0 /etc/rabbitmq/rabbitmq.conf; chmod g+rw /etc/rabbitmq/rabbitmq.conf

# this is only used in the cluster version
ADD cluster-rabbit.sh /
