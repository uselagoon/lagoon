FROM goharbor/clair-photon:v2.1.1-v1.10.0
LABEL maintainer="amazee.io"

COPY docker-entrypoint.sh /home/clair/

USER root

RUN chmod -R g+w /etc/pki/tls/certs \
&& chgrp -R root /etc/pki/tls/certs \
&& chmod +x /home/clair/clair \
&& chmod -R g+w /config \
&& chgrp -R root /home/clair \
&& chmod -R g+w /home/ \
&& mkdir -p /etc/clair \
&& chmod -R g+w /etc/clair \
&& touch /etc/clair/config.yaml

USER 10000