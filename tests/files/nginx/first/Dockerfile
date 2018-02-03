ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/nginx

COPY redirects-map.conf /etc/nginx/redirects-map.conf

RUN fix-permissions /etc/nginx/redirects-map.conf

COPY app/ /app/