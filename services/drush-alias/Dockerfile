ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/nginx:${UPSTREAM_TAG:-latest}
ADD nginx.conf /etc/nginx/conf.d/app.conf
ADD web/ /app/