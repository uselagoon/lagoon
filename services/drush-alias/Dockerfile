ARG UPSTREAM_REPO
FROM ${UPSTREAM_REPO:-uselagoon}/nginx
ADD nginx.conf /etc/nginx/conf.d/app.conf
ADD web/ /app/