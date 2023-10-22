ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/broker-single

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV RABBITMQ_DEFAULT_HA_PATTERN='^lagoon-'\
    RABBITMQ_ERLANG_COOKIE=5188fd99edf19acfefcbb29a16f3d373aa01f66bfe89929852dfad2674d36af2

RUN rabbitmq-plugins --offline enable rabbitmq_peer_discovery_k8s

RUN chmod 0777 /var/lib/rabbitmq /etc/rabbitmq /etc/rabbitmq/conf.d /tmp/rabbitmq-ssl /var/log/rabbitmq;

ADD enabled_plugins /etc/rabbitmq/enabled_plugins
ADD rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
RUN fix-permissions /etc/rabbitmq/rabbitmq.conf
