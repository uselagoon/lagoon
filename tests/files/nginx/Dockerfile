ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/nginx

COPY redirects-map.conf /etc/nginx/redirects-map.conf

RUN fix-permissions /etc/nginx/redirects-map.conf

COPY app/ /app/