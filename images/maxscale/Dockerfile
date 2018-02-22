ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

RUN   apk add --update --no-cache --virtual .mariadb-run-deps \
        libaio \
        libstdc++ \
        cmake \
        sudo \
        wget \
        git \
        mysql \
        gnutls \
        libgcrypt \
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
        libgcrypt-dev \
        linux-headers \
        ncurses-dev \
        gnutls-dev \
        curl \
        curl-dev \
        patch \
        readline-dev \
        zlib-dev


RUN echo "#define _UTSNAME_SYSNAME_LENGTH 65" >> /usr/include/sys/utsname.h
RUN cd /tmp; git clone --branch=2.2.2 --single-branch https://github.com/rtprio/MaxScale.git maxscale; cd /tmp/; mkdir build; cd build; cmake ../maxscale -DBUILD_TESTS=Y -DWITH_SCRIPTS=N -DBUILD_MAXCTRL=N
RUN cd /tmp/build; make; make install

VOLUME /var/log/maxscale

COPY maxscale.cnf /etc/maxscale.cnf
COPY docker-entrypoint.sh /lagoon/entrypoints/80-maxscale

EXPOSE 3306

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["/bin/sh"]
