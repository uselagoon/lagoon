FROM docker.elastic.co/kibana/kibana:5.4.0

USER root

RUN curl -sLo /usr/local/bin/fix-permissions https://raw.githubusercontent.com/sclorg/s2i-base-container/master/core/root/usr/bin/fix-permissions && \
    chmod +x /usr/local/bin/fix-permissions

RUN fix-permissions /usr/share/kibana

ENV xpack.security.enabled=false

ARG AMAZEEIO_GIT_BRANCH=undefined
ENV ELASTICSEARCH_URL "http://${AMAZEEIO_GIT_BRANCH}-elasticsearch:9200"