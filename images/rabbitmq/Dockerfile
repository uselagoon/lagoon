FROM rabbitmq:3-management

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV RABBITMQ_DEFAULT_USER=guest \
    RABBITMQ_DEFAULT_PASS="guest"\
    RABBITMQ_DEFAULT_HA_PATTERN='^$'\
    RABBITMQ_DEFAULT_VHOST='/'

RUN apt-get -y update \
    && apt-get -y install curl \
    && curl -sLo /bin/ep https://github.com/kreuzwerker/envplate/releases/download/1.0.0-RC1/ep-linux \
    && echo "48e234e067874a57a4d4bb198b5558d483ee37bcc285287fffb3864818b42f2785be0568faacbc054e97ca1c5047ec70382e1ca0e71182c9dba06649ad83a5f6  /bin/ep" | sha512sum -c \
    && chmod +x /bin/ep

COPY rabbitmq_delayed_message_exchange-3.7.0.ez /plugins
RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange;

# Copy startup schema with vhost, users, permissions and policies
COPY definitions.json /etc/rabbitmq/definitions.json
RUN chgrp 0 /etc/rabbitmq/definitions.json; chmod g+rw /etc/rabbitmq/definitions.json

# Copy a custom entrypoint
COPY cluster-rabbit.sh /
RUN chgrp 0 /cluster-rabbit.sh; chmod +x /cluster-rabbit.sh

ENTRYPOINT /cluster-rabbit.sh
