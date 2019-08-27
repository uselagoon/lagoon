ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine:3.7

MAINTAINER amazee.io

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /sbin/tini /sbin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

ENV BACKUPS_DIR="/var/lib/mysql/backup"

ENV MARIADB_DATABASE=lagoon \
    MARIADB_USER=lagoon \
    MARIADB_PASSWORD=lagoon \
    MARIADB_ROOT_PASSWORD=Lag00n

# fix some environmental items
RUN mkdir -p /usr/include/bits; mkdir -p /usr/
COPY root/usr/include/bits/wordsize.h /usr/include/bits/wordsize.h

RUN apk add --no-cache --virtual .common-run-deps \
        asio \
        bash \
        boost \
        curl \
        findutils \
        gnutls \
        libaio \
        libgcrypt \
        libstdc++ \
        libuuid \
        lsof \
        mariadb \
        mariadb-client \
        mariadb-common \
        procps \
        pwgen \
        rsync \
        sqlite-libs \
        tzdata \
        wget && \
    apk add --no-cache --virtual .galera-build-deps \
        asio-dev && \
    apk add --no-cache --virtual .common-build-deps \
        attr \
        autoconf \
        bison \
        boost-dev \
        build-base \
        cmake \
        coreutils \
        curl-dev \
        flex \
        git \
        gnutls-dev \
        libaio-dev \
        libgcrypt-dev \
        linux-headers \
        make \
        musl-dev \
        ncurses-dev \
        patch \
        readline-dev \
        scons \
        sqlite-dev  \
        tcl tcl-dev \
        util-linux-dev \
        zlib-dev && \
    cd /tmp && git clone https://github.com/libcheck/check.git && cd check && mkdir build && cd build && cmake ../ && make && make install && \
    cd /tmp && git clone -b mariadb-3.x https://github.com/MariaDB/galera.git && \
    cd /tmp/galera && git checkout 227e96e457acb60037450bc1e81c45594782e906 && git submodule update --init --jobs=6 && sed -i s/PAGE_SIZE/PAGE_SIZE_64K/g galerautils/src/gu_alloc.cpp && sed -i '/#include <limits>/a #include <stdint.h>' galerautils/src/gu_datetime.hpp && \
    cd /tmp/galera && ./scripts/build.sh --so strict_build_flags=0 && \
    mkdir -p /usr/lib64/galera && mv /tmp/galera/libgalera_smm.so /usr/lib64/galera/libgalera_smm.so && \
    apk del --purge .galera-build-deps && \
    apk add --no-cache --virtual .maxscale-run-deps \
        openssl openssl-dev && \
    echo "#define _UTSNAME_SYSNAME_LENGTH 65" >> /usr/include/sys/utsname.h && \
    cd /tmp && git clone --branch=2.2.2 --single-branch https://github.com/rtprio/MaxScale.git maxscale && cd /tmp/ && mkdir maxscale-build && cd maxscale-build && cmake ../maxscale -DBUILD_TESTS=Y -DWITH_SCRIPTS=N -DBUILD_MAXCTRL=N && \
    cd /tmp/maxscale-build && make && make install && \
    apk del --purge .common-build-deps && \
    rm -rf /tmp/* && \
    rm -rf /var/cache/apk/*

COPY entrypoints/ /lagoon/entrypoints/
COPY maxscale.sql /docker-entrypoint-initdb.d/maxscale.sql
COPY maxscale.cnf /etc/maxscale.cnf
COPY maxscale-start.sh /usr/local/bin/maxscale-start
COPY mysql-backup.sh /lagoon/
COPY my.cnf /etc/mysql/my.cnf

RUN for i in /var/run/mysqld /var/lib/mysql /etc/mysql/conf.d /docker-entrypoint-initdb.d/ "${BACKUPS_DIR}"; \
        do mkdir -p $i; chown mysql $i; /bin/fix-permissions $i; \
    done && \
    for i in /var/lib/maxscale /var/log/maxscale /var/cache/maxscale /var/run/maxscale; \
        do mkdir -p $i; /bin/fix-permissions $i; \
    done && \
    /bin/fix-permissions /etc/maxscale.cnf && \
    /bin/fix-permissions /etc/mysql && \
    ln -s /var/lib/mysql/.my.cnf /home/.my.cnf && \
    sed -i 's/#!\/bin\/bash -ue/#!\/bin\/bash -e/' /usr/bin/wsrep_sst_rsync

COPY root/usr/bin/peer-finder /usr/bin/peer-finder
COPY root/usr/share/container-scripts/mysql/readiness-probe.sh /usr/share/container-scripts/mysql/readiness-probe.sh
COPY root/usr/share/container-scripts/mysql/galera.cnf /usr/share/container-scripts/mysql/galera.cnf
COPY root/usr/share/container-scripts/mysql/configure-galera.sh /usr/share/container-scripts/mysql/configure-galera.sh

RUN /bin/fix-permissions /usr/share/container-scripts/mysql/

RUN touch /var/log/mariadb-slow.log && /bin/fix-permissions /var/log/mariadb-slow.log \
    && touch /var/log/mariadb-queries.log && /bin/fix-permissions /var/log/mariadb-queries.log

### we cannot start mysql as root, we add the user mysql to the group root and change the user of the Docker Image to this user
RUN addgroup mysql root
USER mysql
ENV USER_NAME mysql

WORKDIR /var/lib/mysql
VOLUME /var/lib/mysql
EXPOSE 3306

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.bash"]
CMD ["mysqld"]
