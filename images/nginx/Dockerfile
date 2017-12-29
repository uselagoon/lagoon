ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM openresty/openresty:alpine

MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc


RUN apk add --no-cache openssl \
    && mkdir -p /app \
    && rm -f /etc/nginx/conf.d/default.conf /usr/local/openresty/nginx/conf/fastcgi*

COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY fastcgi.conf /etc/nginx/fastcgi.conf
COPY fastcgi.conf /etc/nginx/fastcgi_params
COPY lua/ /etc/nginx/lua/
COPY static-files.conf /etc/nginx/conf.d/app.conf
COPY docker-entrypoint /lagoon/entrypoints/70-nginx-entrypoint

RUN fix-permissions /etc/nginx/ \
    && fix-permissions /usr/local/openresty/nginx/conf \
    && fix-permissions  /usr/local/openresty/nginx/logs/ \
    && fix-permissions /var/run/

EXPOSE 8080

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["nginx", "-g", "daemon off;"]
