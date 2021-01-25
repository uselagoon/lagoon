FROM fluent/fluentd:v1.12-1
LABEL maintainer="support@amazee.io"

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

USER root

RUN apk add --no-cache --update --virtual .build-deps \
      build-base ruby-dev \
      && gem install fluent-plugin-cloudwatch-logs \
      && gem install fluent-plugin-kubernetes_metadata_filter \
      && gem install fluent-plugin-multi-format-parser \
      && gem install fluent-plugin-prometheus \
      && gem install fluent-plugin-rabbitmq \
      && gem install fluent-plugin-record-modifier \
      && gem install fluent-plugin-remote-syslog \
      && gem install fluent-plugin-rewrite-tag-filter \
      && gem install fluent-plugin-route \
      && gem install fluent-plugin-s3 --no-document \
      && gem install fluent-plugin-sumologic_output \
      && gem sources --clear-all \
      && apk del .build-deps \
      && rm -rf /tmp/* /var/tmp/* /usr/lib/ruby/gems/*/cache/*.gem \
      && apk add --no-cache curl

COPY fluent.conf /fluentd/etc/
COPY entrypoint.sh /bin/

USER fluent

# environment variables that must be defined to point to the k8s api
# these are set by default when running in k8s
ENV KUBERNETES_SERVICE_HOST KUBERNETES_SERVICE_PORT
