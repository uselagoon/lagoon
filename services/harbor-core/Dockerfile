FROM goharbor/harbor-core:v1.10.0
LABEL maintainer="amazee.io"

COPY entrypoint.sh /

USER root

RUN chmod +rx /entrypoint.sh

USER 10000

ENTRYPOINT /entrypoint.sh