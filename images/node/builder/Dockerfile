ARG NODE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/node:${NODE_VERSION}

MAINTAINER amazee.io
ENV LAGOON=node

RUN apk update \
    && apk upgrade \
    && apk add --no-cache \
        libstdc++ \
    && apk add --no-cache \
        binutils-gold \
        curl \
        g++ \
        gcc \
        gnupg \
        libgcc \
        linux-headers \
        make \
        git \
        file \
        openssl \
    && rm -rf /var/cache/apk/*

CMD ["/bin/docker-sleep"]