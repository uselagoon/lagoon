ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/nginx

MAINTAINER amazee.io
ENV LAGOON=nginx

RUN mkdir -p /etc/nginx/conf.d/drupal

COPY drupal.conf /etc/nginx/conf.d/app.conf

RUN fix-permissions /etc/nginx
