FROM openjdk:7-jre-alpine

ENV SOLR_VERSION 3.6.2
ENV SOLR_TGZ apache-solr-$SOLR_VERSION.tgz
ENV SOLR_URL http://archive.apache.org/dist/lucene/solr/$SOLR_VERSION/$SOLR_TGZ
ENV INSTALL_PATH /opt/solr
ENV AMAZEEIO_AUTODISCOVERY_SOLR true
ENV SOLR_USER solr
ENV SOLR_UID 8983

RUN apk add --no-cache \
        bash

RUN addgroup -g $SOLR_UID $SOLR_USER && \
    adduser -u $SOLR_UID -G $SOLR_USER $SOLR_USER -D

RUN wget -q $SOLR_URL -O /tmp/$SOLR_TGZ && \
    mkdir -p $INSTALL_PATH && \
    tar -C $INSTALL_PATH --extract --file /tmp/$SOLR_TGZ --strip-components=1 && \
    rm /tmp/$SOLR_TGZ && \
    mkdir -p /docker-entrypoint-initdb.d /opt/docker-solr/ /opt/solr/server/solr/mycores /solr-conf && \
    chown -R $SOLR_USER:$SOLR_USER $INSTALL_PATH

COPY drupal-4.3-solr-3.x/conf/ /solr-conf

COPY scripts /opt/docker-solr/scripts
RUN chown -R $SOLR_USER:$SOLR_USER /opt/docker-solr /solr-conf
ENV PATH /opt/solr/bin:/opt/docker-solr/scripts:$PATH

EXPOSE 8983
USER $SOLR_USER
WORKDIR /opt/solr

VOLUME /opt/solr/server/solr/mycores/

ENTRYPOINT ["docker-entrypoint.sh"]
CMD [ "solr-precreate", "drupal", "/solr-conf" ]
