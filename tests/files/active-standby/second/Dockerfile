ARG UPSTREAM_REPO
FROM ${UPSTREAM_REPO:-uselagoon}/nginx

COPY redirects-map.conf /etc/nginx/redirects-map.conf

RUN fix-permissions /etc/nginx/redirects-map.conf

COPY app/ /app/
COPY .lagoon.yml /app/.