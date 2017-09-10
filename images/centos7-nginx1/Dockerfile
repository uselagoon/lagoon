ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7

RUN { \
      echo '[nginx]'; \
      echo 'name = nginx'; \
      echo 'baseurl=http://nginx.org/packages/centos/$releasever/$basearch/'; \
      echo 'gpgkey=http://nginx.org/keys/nginx_signing.key'; \
      echo 'gpgcheck=1'; \
      echo 'enabled=1'; \
    } > /etc/yum.repos.d/nginx.repo

RUN yum install -y \
        nginx && \
    yum clean all

COPY docker-entrypoint /amazeeio/entrypoints/70-nginx-entrypoint

COPY nginx.conf /etc/nginx/nginx.conf
COPY fastcgi.conf /etc/nginx/fastcgi.conf
COPY fastcgi.conf /etc/nginx/fastcgi_params

RUN mkdir -p /app /etc/nginx/sites && \
    fix-permissions /app && \
    fix-permissions /etc/nginx/ && \
    fix-permissions /var/log/nginx/ && \
    fix-permissions /var/cache/nginx/ && \
    fix-permissions /run/

ENV AMAZEEIO=AMAZEEIO \
    AMAZEEIO_HTTP_PORT=8080

CMD [ "nginx" ]
