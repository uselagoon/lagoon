ARG IMAGE_REPO=amazeeio
FROM ${IMAGE_REPO}/centos7-nginx:1.12

COPY drupal.conf /etc/nginx/sites/drupal.conf

RUN fix-permissions /etc/nginx
