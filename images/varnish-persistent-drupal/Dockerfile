ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/varnish-drupal

VOLUME /var/cache/varnish

ENV CACHE_TYPE=file \
    CACHE_OPTIONS=/var/cache/varnish/file,950M
