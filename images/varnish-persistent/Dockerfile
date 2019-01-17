ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/varnish

VOLUME /var/cache/varnish

ENV CACHE_TYPE=file \
    CACHE_OPTIONS=/var/cache/varnish/file,950M

RUN fix-permissions /etc/varnish/default.vcl
