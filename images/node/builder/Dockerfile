ARG BASE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/node:${BASE_VERSION}

LABEL maintainer="amazee.io"
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
        python \
        bash \
        ca-certificates \
        wget \
        libpng-dev \
    && wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub \
    && wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk \
    && apk add glibc-2.28-r0.apk \
    && rm -rf /var/cache/apk/*

CMD ["/bin/docker-sleep"]
