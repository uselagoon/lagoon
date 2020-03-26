FROM goharbor/harbor-registryctl:v1.10.0

COPY --chown=harbor:root start.sh /home/harbor/
COPY --chown=harbor:root install_cert.sh /home/harbor/

USER root

RUN chmod -R g+w /etc/pki/tls/certs \
&& chgrp -R root /etc/pki/tls/certs \
&& chmod -R g+w /var/lib/registry \
&& chmod -R g+w /etc/registry \
&& chgrp -R root /home/harbor \
&& chmod -R g+w /home/harbor \
&& if [ -f /storage ]; then chmod -R g+w /storage; fi

USER 10000