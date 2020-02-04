FROM goharbor/clair-photon:v2.1.1-v1.10.0
LABEL maintainer="amazee.io"

COPY --chown=clair:root docker-entrypoint.sh /home/clair/
COPY --chown=clair:root install_cert.sh /home/clair/

USER root

RUN chmod -R g+w /etc/pki/tls/certs \
&& chgrp -R root /etc/pki/tls/certs \
&& chmod +x /home/clair/clair \
&& chmod +x /home/clair/dumb-init \
&& chmod -R g+w /config \
&& chgrp -R root /home/clair \
&& chmod -R g+w /home/ \
&& mkdir -p /etc/clair \
&& chmod -R g+w /etc/clair \
&& touch /etc/clair/config.yaml

USER clair