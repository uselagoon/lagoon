FROM goharbor/nginx-photon:v1.10.0
LABEL maintainer="amazee.io"

COPY nginx.conf /etc/nginx/nginx.conf

USER root

RUN chown root:root /etc/nginx/nginx.conf && chmod 744 /etc/nginx/nginx.conf && chmod -R g+r /etc/nginx

USER nginx