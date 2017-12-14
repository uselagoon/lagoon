FROM rabbitmq:3-management

COPY rabbitmq_delayed_message_exchange-3.7.0.ez /plugins

RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange

ENV RABBITMQ_DEFAULT_USER=guest \
    RABBITMQ_DEFAULT_PASS="guest" \
    NODENAME="rabbitmq@localhost"