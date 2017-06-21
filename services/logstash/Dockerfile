FROM docker.elastic.co/logstash/logstash:5.4.0

USER root

RUN curl -sLo /usr/local/bin/fix-permissions https://raw.githubusercontent.com/sclorg/s2i-base-container/master/bin/fix-permissions && \
    chmod +x /usr/local/bin/fix-permissions

COPY logstash.conf /usr/share/logstash/pipeline/logstash.conf
COPY logstash.yml /usr/share/logstash/config/logstash.yml

RUN fix-permissions /usr/share/logstash