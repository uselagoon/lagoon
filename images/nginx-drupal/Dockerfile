ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/nginx

MAINTAINER amazee.io

COPY drupal.conf /etc/nginx/conf.d/app.conf

RUN fix-permissions /etc/nginx