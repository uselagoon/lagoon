FROM rabbitmq:3-management

COPY rabbitmq_delayed_message_exchange-0.0.1.ez /plugins

RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange

ENV RABBITMQ_DEFAULT_USER=guest \
    RABBITMQ_DEFAULT_PASS="guest" \
    NODENAME="rabbitmq@localhost"