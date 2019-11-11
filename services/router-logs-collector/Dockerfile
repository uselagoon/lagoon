FROM fluent/fluentd:v1.7-1
LABEL maintainer="support@amazee.io"

USER root

RUN apk add --no-cache --update --virtual .build-deps \
      build-base ruby-dev \
      && gem install fluent-plugin-rabbitmq \
      && gem install fluent-plugin-kubernetes_metadata_filter \
      && gem sources --clear-all \
      && apk del .build-deps \
      && rm -rf /home/fluent/.gem/ruby/2.5.0/cache/*.gem \
      && apk add --no-cache curl

COPY fluent.conf /fluentd/etc/
COPY entrypoint.sh /bin/

EXPOSE 5140/udp

USER fluent

# environment variables that must be defined to point to the k8s api
ENV KUBERNETES_SERVICE_HOST KUBERNETES_SERVICE_PORT
