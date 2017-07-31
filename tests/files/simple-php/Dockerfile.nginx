ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/centos7-nginx:1.12

COPY nginx-site.conf /etc/nginx/sites/
COPY app/ /app/


EXPOSE 8080


