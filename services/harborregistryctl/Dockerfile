FROM goharbor/harbor-registryctl:v1.9.2

COPY start.sh /harbor/

USER root

RUN chmod -R g+w /etc/pki/tls/certs && chmod -R g+w /var/lib/registry && chmod -R g+w /etc/registry && if [ -f /storage ]; then chmod -R g+w /storage; fi

USER 10000