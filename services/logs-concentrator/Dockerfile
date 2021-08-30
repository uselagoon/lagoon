FROM fluent/fluentd:v1.13-1
LABEL maintainer="support@amazee.io"

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

USER root

RUN apk add --no-cache --update --virtual .build-deps \
      build-base ruby-dev \
      && gem install fluent-plugin-elasticsearch \
      && gem install fluent-plugin-prometheus \
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
