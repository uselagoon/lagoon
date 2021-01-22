FROM fluent/fluentd:v0.12
# Note; we are _NOT_ running fluentd v0.12
# One of the gem commands below is upgrading fluentd to the newest version

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

USER root

RUN apk add --no-cache tini \
 && apk add --update --virtual .build-deps \
        sudo build-base ruby-dev \
 && gem install \
        fluent-plugin-elasticsearch \
        fluent-plugin-secure-forward \
        fluent-plugin-record-modifier \
        fluent-plugin-prometheus \
 && gem sources --clear-all \
 && apk del .build-deps \
 && rm -rf /var/cache/apk/* \
           /home/fluent/.gem/ruby/2.3.0/cache/*.gem

COPY entrypoint.sh /bin/
COPY ca_cert.pem ca_key.pem /fluentd/ssl/

RUN find "/fluentd" -exec chgrp 0 {} \;
RUN find "/fluentd" -exec chmod g+rw {} \;
RUN find "/fluentd" -type d -exec chmod g+x {} +

ENV LOGS_FORWARDER_SHARED_KEY=secret \
    LOGS_FORWARDER_TARGET_SHARED_KEY=secret \
    LOGS_FORWARDER_PRIVATE_KEY_PASSPHRASE=amazing1 \
    ELASTICSEARCH_HOST=logs-db-service \
    ELASTICSEARCH_HOST_PORT=9200

ENTRYPOINT ["/sbin/tini", "--", "/bin/entrypoint.sh"]
CMD ["sh", "-c", "exec fluentd -c /fluentd/etc/fluent.conf -p /fluentd/plugins $FLUENTD_OPT"]
