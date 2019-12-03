FROM goharbor/clair-photon:v2.0.9-v1.9.3
LABEL maintainer="amazee.io"

COPY docker-entrypoint.sh /

USER root

RUN chmod -R g+w /etc/pki/tls/certs \
&& chmod +x /clair/clair \
&& chmod -R g+w /config \
&& chgrp -R root /clair \
&& chmod -R g+w /clair \
&& mkdir -p /etc/clair \
&& chmod -R g+w /etc/clair \
&& touch /etc/clair/config.yaml

USER 10000