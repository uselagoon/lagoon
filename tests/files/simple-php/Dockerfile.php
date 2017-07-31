ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/centos7-php:7.0

COPY app/ /app/
