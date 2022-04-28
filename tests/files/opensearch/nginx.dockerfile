ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-testlagoon}/nginx:${UPSTREAM_TAG:-latest}

COPY app.conf /etc/nginx/conf.d/app.conf
