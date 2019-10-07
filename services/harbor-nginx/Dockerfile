FROM goharbor/nginx-photon:v1.9.0-dev
LABEL maintainer="amazee.io"

COPY nginx.conf /etc/nginx/nginx.conf

USER root

RUN chown root:root /etc/nginx/nginx.conf && chmod 744 /etc/nginx/nginx.conf && chmod -R g+r /etc/nginx

USER nginx