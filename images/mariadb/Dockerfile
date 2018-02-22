ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine

MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

MAINTAINER amazee.io
ENV BACKUPS_DIR="/var/lib/mysql/backup"

ENV MARIADB_DATABASE=lagoon \
    MARIADB_USER=lagoon \
    MARIADB_PASSWORD=lagoon

RUN apk add --update --no-cache --virtual .mariadb-run-deps \
        asio \
        bash \
        boost \
        findutils \
        libaio \
        libstdc++ \
        lsof \
        mariadb \
        mariadb-client \
        mariadb-common \
        procps \
        pwgen \
        rsync \
        tzdata \
        wget

# fix some environmental items
RUN mkdir -p /usr/include/bits; mkdir -p /usr/
COPY wordsize.h /usr/include/bits/wordsize.h

RUN apk add --update --no-cache --virtual .mariadb-build-deps \
        asio-dev \
        attr \
        autoconf \
        bison \
        boost-dev \
        build-base \
        cmake \
        coreutils \
        git \
        libaio-dev \
        libressl-dev \
        linux-headers \
        make \
        ncurses-dev \
        patch \
        readline-dev \
        scons \
        zlib-dev ; \
    cd /tmp && git clone https://github.com/libcheck/check.git && cd check && mkdir build && cd build && cmake ../ && make && make install; \
    cd /tmp && git clone -b mariadb-3.x https://github.com/MariaDB/galera.git; \
    cd /tmp/galera && sed -i s/PAGE_SIZE/PAGE_SIZE_64K/g galerautils/src/gu_alloc.cpp && sed -i '/#include <limits>/a #include <stdint.h>' galerautils/src/gu_datetime.hpp ; \
    cd /tmp/galera && ./scripts/build.sh --so strict_build_flags=0 ; \
    mkdir -p /usr/lib64/galera && mv /tmp/galera/libgalera_smm.so /usr/lib64/galera/libgalera_smm.so ; \
    apk del --purge .mariadb-build-deps; \
    rm -rf /tmp/*; \
    rm -rf /var/cache/apk/*



RUN for i in /var/run/mysqld /var/lib/mysql /etc/mysql/conf.d /docker-entrypoint-initdb.d/ "${BACKUPS_DIR}"; \
do mkdir -p $i; /bin/fix-permissions $i; done

# USER mysql

COPY docker-entrypoint.sh /lagoon/entrypoints/90-mariadb-entrypoint
COPY mysql-backup.sh /lagoon/

COPY my.cnf /etc/mysql/my.cnf

RUN ln -s /var/lib/mysql/.my.cnf /home/.my.cnf

WORKDIR /var/lib/mysql
VOLUME /var/lib/mysql
EXPOSE 3306

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["mysqld"]
