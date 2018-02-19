ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons

ENV MARIADB_DATABASE=infrastructure \
    MARIADB_USER=api \
    MARIADB_PASSWORD=api

# COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d/

RUN   apk add --update --no-cache --virtual .mariadb-run-deps \
        libaio \
        libstdc++ \
        cmake \
        sudo \
        wget \
        git \
        mysql \
        libuuid \
        tzdata && \
    apk add --update --no-cache --virtual .mariadb-build-deps \
        attr \
        sqlite-dev sqlite \
        musl-dev \
        autoconf \
        bison \
        build-base bison flex \
        coreutils \
        libaio-dev \
        util-linux-dev \
        linux-headers \
        openssl \
        openssl-dev \
        tcl tcl-dev \
        linux-headers \
        ncurses-dev \
        curl \
        curl-dev \
        patch \
        readline-dev \
        zlib-dev




RUN cd /tmp; git clone https://github.com/mariadb-corporation/MaxScale.git maxscale; cd /tmp/; mkdir build; cd build; cmake ../maxscale -DBUILD_TESTS=Y -DWITH_SCRIPTS=N

RUN echo "#define _UTSNAME_SYSNAME_LENGTH 65 >> /usr/include/sys/utsname.h"
RUN cd /tmp/build; make

# RUN cd /tmp/build; find .
