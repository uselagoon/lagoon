ARG UPSTREAM_REPO
FROM ${UPSTREAM_REPO:-uselagoon}/nginx

ENV BASIC_AUTH_USERNAME=username \
    BASIC_AUTH_PASSWORD=password

COPY app/ /app/

# this should disable the basic auth again
COPY .lagoon.env.nginx /app/