FROM rabbitmq:3-management

COPY rabbitmq_delayed_message_exchange-3.7.0.ez /plugins

RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange; \
    rabbitmq-plugins --offline enable rabbitmq_peer_discovery_k8s

ENV RABBITMQ_DEFAULT_USER=guest \
    RABBITMQ_DEFAULT_PASS="guest"

ADD enabled_plugins /etc/rabbitmq/enabled_plugins
ADD rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
RUN chgrp 0 /etc/rabbitmq/rabbitmq.conf; chmod g+rw /etc/rabbitmq/rabbitmq.conf

# this is only used in the cluster version
ADD cluster-rabbit.sh /
