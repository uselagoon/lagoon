ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} as commons
# alpine 3.12 as per https://github.com/docker-library/rabbitmq/blob/master/3.8/alpine/Dockerfile
FROM rabbitmq:3.8.16-management-alpine

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV RABBITMQ_DEFAULT_USER='guest' \
    RABBITMQ_DEFAULT_PASS='guest'\
    RABBITMQ_DEFAULT_HA_PATTERN='^$'\
    RABBITMQ_DEFAULT_VHOST='/'

COPY --from=commons /bin/ep /bin/fix-permissions /bin/

COPY rabbitmq_delayed_message_exchange-3.8.9.ez /plugins
RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange rabbitmq_prometheus;

# Copy startup schema with vhost, users, permissions and policies
COPY definitions.json /etc/rabbitmq/definitions.json
RUN fix-permissions /etc/rabbitmq/definitions.json

# Copy a custom entrypoint
COPY cluster-rabbit.sh /
RUN fix-permissions /cluster-rabbit.sh && chmod +x /cluster-rabbit.sh

ENTRYPOINT /cluster-rabbit.sh
