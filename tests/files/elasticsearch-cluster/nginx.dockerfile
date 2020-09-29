ARG UPSTREAM_REPO
FROM ${UPSTREAM_REPO:-uselagoon}/nginx

COPY app.conf /etc/nginx/conf.d/app.conf
