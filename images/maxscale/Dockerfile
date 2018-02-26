ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

ENV USER_NAME maxscale

RUN apk add --update --no-cache --virtual .mariadb-run-deps \
        libaio \
        libstdc++ \
        cmake \
        sudo \
        wget \
        git \
        openssl \
        mysql \
        gnutls \
        libgcrypt \
        libuuid \
        tzdata \
        sqlite-libs

RUN apk add --update --no-cache --virtual .mariadb-build-deps \
        attr \
        sqlite-dev  \
        musl-dev \
        autoconf \
        bison \
        build-base bison flex \
        coreutils \
        libaio-dev \
        util-linux-dev \
        linux-headers \
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
        zlib-dev ; \
echo "#define _UTSNAME_SYSNAME_LENGTH 65" >> /usr/include/sys/utsname.h ; \
cd /tmp; git clone --branch=2.2.2 --single-branch https://github.com/rtprio/MaxScale.git maxscale; cd /tmp/; mkdir build; cd build; cmake ../maxscale -DBUILD_TESTS=Y -DWITH_SCRIPTS=N -DBUILD_MAXCTRL=N ; \
cd /tmp/build; make; make install ; \
apk del --purge .mariadb-build-deps; \
rm -rf /tmp/*; \
rm -rf /var/cache/apk/*


COPY maxscale.cnf /etc/maxscale.cnf
COPY docker-entrypoint.sh /lagoon/entrypoints/80-maxscale

RUN for i in /var/lib/maxscale /var/log/maxscale /var/cache/maxscale /var/run/maxscale; do mkdir -p $i; /bin/fix-permissions $i; done && /bin/fix-permissions /etc/maxscale.cnf

# USER maxscale
EXPOSE 3306

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["/bin/sh"]
