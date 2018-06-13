FROM fluent/fluentd:v0.12-onbuild

USER root

RUN apk add --update --virtual .build-deps \
        sudo build-base ruby-dev \
 && gem install \
        fluent-plugin-elasticsearch \
        fluent-plugin-secure-forward \
        fluent-plugin-record-reformer \
        # fluent-plugin-anonymizer \
 && gem sources --clear-all \
 && apk del .build-deps \
 && rm -rf /var/cache/apk/* \
           /home/fluent/.gem/ruby/2.3.0/cache/*.gem

COPY entrypoint.sh /bin/

RUN find "/fluentd" -exec chgrp 0 {} \;
RUN find "/fluentd" -exec chmod g+rw {} \;
RUN find "/fluentd" -type d -exec chmod g+x {} +

ENTRYPOINT ["/bin/entrypoint.sh"]
CMD exec fluentd -c /fluentd/etc/${FLUENTD_CONF} -p /fluentd/plugins $FLUENTD_OPT
