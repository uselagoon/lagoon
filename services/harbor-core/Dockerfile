FROM goharbor/harbor-core:v1.10.2
LABEL maintainer="amazee.io"

COPY entrypoint.sh /
COPY 0015_1.10.0_schema.up.sql /harbor/migrations/postgresql/

USER root

RUN chmod +rx /entrypoint.sh

USER 10000

ENTRYPOINT /entrypoint.sh