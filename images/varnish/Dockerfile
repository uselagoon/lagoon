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
COPY varnish-start.sh /varnish-start.sh

RUN fix-permissions /etc/varnish/ \
    && fix-permissions /var/run/ \
    && fix-permissions /var/lib/varnish

COPY docker-entrypoint /lagoon/entrypoints/70-varnish-entrypoint

EXPOSE 8080

# tells the local development environment on which port we are running
ENV LAGOON_LOCALDEV_HTTP_PORT=8080

# Make http_resp_hdr_len and http_resp_size configurable (see in docker-entrypoint)
ENV HTTP_RESP_HDR_LEN=8k
ENV HTTP_RESP_SIZE=32k

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD [" /varnish-start.sh"]
