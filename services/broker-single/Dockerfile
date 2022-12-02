ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} as commons
FROM rabbitmq:3.10.7-management-alpine

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV RABBITMQ_DEFAULT_USER='guest' \
    RABBITMQ_DEFAULT_PASS='guest'\
    RABBITMQ_DEFAULT_HA_PATTERN='^$'\
    RABBITMQ_DEFAULT_VHOST='/'

COPY --from=commons /bin/ep /bin/fix-permissions /bin/

RUN wget -P /plugins https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/3.10.2/rabbitmq_delayed_message_exchange-3.10.2.ez \
    && chown rabbitmq:rabbitmq /plugins/rabbitmq_delayed_message_exchange-* \
    && rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange rabbitmq_prometheus;

# Copy startup schema with vhost, users, permissions and policies
COPY definitions.json /etc/rabbitmq/definitions.json
RUN fix-permissions /etc/rabbitmq/definitions.json

# Copy a custom entrypoint
COPY cluster-rabbit.sh /
RUN fix-permissions /cluster-rabbit.sh && chmod +x /cluster-rabbit.sh

ENTRYPOINT /cluster-rabbit.sh
