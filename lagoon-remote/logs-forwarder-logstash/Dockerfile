FROM uselagoon/logstash-7

RUN sed -ibak s/^xpack.*//g /usr/share/logstash/config/logstash.yml

ENV XPACK_MONITORING_ENABLED=false

ENV LOGS_FORWARDER_LOGSTASH_TARGET_HOST=url.of.logs-forwader-logstash.target \
    LOGS_FORWARDER_LOGSTASH_TARGET_PORT=30703

# Remove default shipped pipeline
RUN rm -f pipeline/logstash.conf

COPY logstash.conf /usr/share/logstash/pipeline/logstash.conf

COPY certs/ certs/


