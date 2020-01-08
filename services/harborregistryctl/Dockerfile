FROM goharbor/harbor-registryctl:v1.10.0

COPY start.sh /harbor/
COPY --chown=harbor:root install_cert.sh /home/harbor/

USER root

RUN chmod -R g+w /etc/pki/tls/certs && chmod -R g+w /var/lib/registry && chmod -R g+w /etc/registry && if [ -f /storage ]; then chmod -R g+w /storage; fi

USER 10000