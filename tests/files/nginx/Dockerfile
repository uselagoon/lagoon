ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/nginx

COPY redirects.conf /etc/nginx/redirects.conf

RUN fix-permissions /etc/nginx/redirects.conf

COPY app/ /app/