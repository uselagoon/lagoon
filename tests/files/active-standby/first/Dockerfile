ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-testlagoon}/nginx:${UPSTREAM_TAG:-latest}

COPY redirects-map.conf /etc/nginx/redirects-map.conf

RUN fix-permissions /etc/nginx/redirects-map.conf

COPY app/ /app/
COPY .lagoon.yml /app/.