FROM goharbor/harbor-core:v1.9.0-dev
LABEL maintainer="amazee.io"

COPY entrypoint.sh /

RUN chmod +rx /entrypoint.sh

ENTRYPOINT /entrypoint.sh