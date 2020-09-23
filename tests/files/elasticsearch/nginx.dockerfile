ARG IMAGE_REPO
FROM uselagoon/nginx

COPY app.conf /etc/nginx/conf.d/app.conf
