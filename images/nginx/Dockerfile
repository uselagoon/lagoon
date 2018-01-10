ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM nginx:alpine

MAINTAINER amazee.io
ENV LAGOON=nginx

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN apk add --no-cache openssl

COPY nginx.conf /etc/nginx/nginx.conf
COPY fastcgi.conf /etc/nginx/fastcgi.conf
COPY fastcgi.conf /etc/nginx/fastcgi_params
COPY helpers/ /etc/nginx/helpers/
COPY static-files.conf /etc/nginx/conf.d/app.conf
COPY redirects-map.conf /etc/nginx/redirects-map.conf

RUN mkdir -p /app \
    && rm -f /etc/nginx/conf.d/default.conf \
    && fix-permissions /etc/nginx/ \
    && fix-permissions /var/cache/nginx \
    && fix-permissions /var/run/

COPY docker-entrypoint /lagoon/entrypoints/70-nginx-entrypoint

EXPOSE 8080

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["nginx", "-g", "daemon off;"]
