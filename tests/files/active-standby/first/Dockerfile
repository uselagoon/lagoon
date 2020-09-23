ARG IMAGE_REPO
FROM uselagoon/nginx

COPY redirects-map.conf /etc/nginx/redirects-map.conf

RUN fix-permissions /etc/nginx/redirects-map.conf

COPY app/ /app/
COPY .lagoon.yml /app/.