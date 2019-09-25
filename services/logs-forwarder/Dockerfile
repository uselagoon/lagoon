FROM fluent/fluentd:v0.12

USER root

RUN apk add --no-cache tini \
 && apk add --update --virtual .build-deps \
        sudo build-base ruby-dev \
 && gem install \
        fluent-plugin-elasticsearch \
        fluent-plugin-secure-forward \
        fluent-plugin-record-modifier \
 && gem install fluent-plugin-prometheus --version='~>1.0.0' \
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
    LOGS_FORWARDER_PRIVATE_KEY_PASSPHRASE=amazing1

ENTRYPOINT ["/sbin/tini", "--", "/bin/entrypoint.sh"]
CMD ["sh", "-c", "exec fluentd -c /fluentd/etc/fluent.conf -p /fluentd/plugins $FLUENTD_OPT"]
