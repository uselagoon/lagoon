ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons


FROM alpine:3.7 as vmod

ENV VERSION=5.2
RUN apk --no-cache add varnish varnish-dev automake autoconf libtool python py-docutils make
RUN cd /tmp && wget https://github.com/nigoroll/libvmod-dynamic/archive/${VERSION}.zip && \
  unzip ${VERSION}.zip && cd libvmod-dynamic-${VERSION} && \
  ./autogen.sh && ./configure && make && make install

FROM alpine:3.7

LABEL maintainer="amazee.io"
ENV LAGOON=varnish

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /sbin/tini /sbin/
COPY --from=commons /home /home

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc

RUN apk --no-cache add varnish

RUN echo "${VARNISH_SECRET:-lagoon_default_secret}" >> /etc/varnish/secret

COPY default.vcl /etc/varnish/default.vcl
COPY varnish-start.sh /varnish-start.sh

RUN fix-permissions /etc/varnish/ \
    && fix-permissions /var/run/ \
    && fix-permissions /var/lib/varnish

COPY docker-entrypoint /lagoon/entrypoints/70-varnish-entrypoint

COPY --from=vmod /usr/lib/varnish/vmods/libvmod_dynamic.* /usr/lib/varnish/vmods/

EXPOSE 8080

# tells the local development environment on which port we are running
ENV LAGOON_LOCALDEV_HTTP_PORT=8080

ENV HTTP_RESP_HDR_LEN=8k \
    HTTP_RESP_SIZE=32k \
    NUKE_LIMIT=150 \
    CACHE_SIZE=100M

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/varnish-start.sh"]
