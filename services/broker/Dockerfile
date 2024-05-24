ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} as commons
FROM rabbitmq:3.11.28-management-alpine

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV SERVICE_NAME='localhost' \
    RABBITMQ_DEFAULT_USER='guest' \
    RABBITMQ_DEFAULT_PASS='guest' \
    RABBITMQ_DEFAULT_HA_PATTERN='^$' \
    RABBITMQ_DEFAULT_VHOST='/' \
    RABBITMQ_DEFAULT_HA_PATTERN='^lagoon-' \
    RABBITMQ_ERLANG_COOKIE=5188fd99edf19acfefcbb29a16f3d373aa01f66bfe89929852dfad2674d36af2

COPY --from=commons /bin/ep /bin/fix-permissions /bin/

RUN apk add --no-cache \
      gojq \
      curl

RUN wget -P /plugins https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/3.11.1/rabbitmq_delayed_message_exchange-3.11.1.ez \
    && chown rabbitmq:rabbitmq /plugins/rabbitmq_delayed_message_exchange-*

# override sticky bit set in upstream whilst we still ep the files in /etc/rabbitmq
RUN chmod 0777 /var/lib/rabbitmq /etc/rabbitmq /etc/rabbitmq/conf.d /tmp/rabbitmq-ssl /var/log/rabbitmq;

COPY definitions.json enabled_plugins rabbitmq.conf /etc/rabbitmq/
RUN fix-permissions /etc/rabbitmq

COPY start-rabbit.sh enable-feature-flags.sh /
RUN fix-permissions start-rabbit.sh enable-feature-flags.sh && chmod +x /start-rabbit.sh /enable-feature-flags.sh

# Copy the new entrypoint for b/c reasons
COPY /start-rabbit.sh /cluster-rabbit.sh

ENTRYPOINT /start-rabbit.sh
