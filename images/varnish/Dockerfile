ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine

MAINTAINER amazee.io
ENV LAGOON=varnish

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN apk --no-cache add varnish

RUN echo "${VARNISH_SECRET:-lagoon_default_secret}" >> /etc/varnish/secret

COPY default.vcl /etc/varnish/default.vcl

RUN fix-permissions /etc/varnish/ \
    && fix-permissions /var/run/ \
    && fix-permissions /var/lib/varnish

COPY docker-entrypoint /lagoon/entrypoints/70-varnish-entrypoint

EXPOSE 8080

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["varnishd", "-a", ":8080", "-T", ":6082", "-F", "-f", "/etc/varnish/default.vcl", "-S", "/etc/varnish/secret"]
