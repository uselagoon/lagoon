ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine

MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home/.bashrc /home/.bashrc

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN echo "@edge http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories
RUN apk update && apk add varnish@edge

COPY default.vcl /etc/varnish/default.vcl

RUN fix-permissions /etc/varnish/ \
    && fix-permissions /var/run/

COPY docker-entrypoint /lagoon/entrypoints/70-varnish-entrypoint

EXPOSE 7080

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["varnishd", "-F", "-f", "/etc/varnish/default.vcl", ">>", "/var/log/varnish/start.log 2>&1"]
