FROM goharbor/registry-photon:v2.7.1-patch-2819-2553-v1.10.0

COPY entrypoint.sh /

USER root

RUN chmod -R g+w /etc/pki/tls/certs && chmod -R g+w /var/lib/registry && chmod -R g+w /etc/registry && if [ -f /storage ]; then chmod -R g+w /storage; fi

USER 10000