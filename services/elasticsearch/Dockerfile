FROM docker.elastic.co/elasticsearch/elasticsearch:5.4.0

USER root

RUN curl -sLo /usr/local/bin/fix-permissions https://raw.githubusercontent.com/sclorg/s2i-base-container/master/core/root/usr/bin/fix-permissions && \
    chmod +x /usr/local/bin/fix-permissions

RUN fix-permissions /usr/share/elasticsearch

ENV http.host=0.0.0.0 transport.host=127.0.0.1 xpack.security.enabled=false

ENV ES_JAVA_OPTS "-Xms1000m -Xmx1000m"