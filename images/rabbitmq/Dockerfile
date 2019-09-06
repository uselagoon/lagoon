FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM rabbitmq:3-management

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV RABBITMQ_DEFAULT_USER='guest' \
    RABBITMQ_DEFAULT_PASS='guest'\
    RABBITMQ_DEFAULT_HA_PATTERN='^$'\
    RABBITMQ_DEFAULT_VHOST='/'

COPY --from=commons /bin/ep /bin/

COPY rabbitmq_delayed_message_exchange-3.7.0.ez /plugins
RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange;

# Copy startup schema with vhost, users, permissions and policies
COPY definitions.json /etc/rabbitmq/definitions.json
RUN chgrp 0 /etc/rabbitmq/definitions.json; chmod g+rw /etc/rabbitmq/definitions.json

# Copy a custom entrypoint
COPY cluster-rabbit.sh /
RUN chgrp 0 /cluster-rabbit.sh; chmod +x /cluster-rabbit.sh

ENTRYPOINT /cluster-rabbit.sh
