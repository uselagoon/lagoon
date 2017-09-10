ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-nginx1

COPY nginx-site.conf /etc/nginx/sites/
COPY app/ /app/


EXPOSE 8080


