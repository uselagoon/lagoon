FROM goharbor/chartmuseum-photon:v1.9.2
LABEL maintainer="amazee.io"

COPY docker-entrypoint.sh /

USER root

RUN chmod -R g+w /etc/pki/tls/certs \
    && chgrp -R root /chartserver \
    && chmod -R g+w /chartserver \
    && chmod +x /chartserver/chartm \
    && if [ -f /chart_storage ]; then chmod -R g+w /chart_storage && chgrp -R root /chart_storage; fi

USER 10000