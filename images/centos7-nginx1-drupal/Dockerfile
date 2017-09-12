ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-nginx1

COPY drupal.conf /etc/nginx/sites/drupal.conf

RUN fix-permissions /etc/nginx