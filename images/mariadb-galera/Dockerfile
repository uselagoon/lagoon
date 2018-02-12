ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/mariadb

ENV MARIADB_DATABASE=drupal \
    MARIADB_USER=drupal \
    MARIADB_PASSWORD=drupal


# fix some environmental items
# RUN mkdir -p /usr/include/bits; mkdir -p /usr/
# COPY wordsize.h /usr/include/bits/wordsize.h
# replace poll.h with one that doesn't break the build
# RUN echo "#include <poll.h>" > /usr/include/sys/poll.h


RUN   apk add --update --no-cache --virtual .mariadb-run-deps \
        libaio \
        libstdc++ \
        make \
        pwgen \
        sudo \
        wget \
        git \
        boost boost-dev \
        asio asio-dev \
        scons \
        tzdata && \
    apk add --update --no-cache --virtual .mariadb-build-deps \
        attr \
        autoconf \
        bison \
        build-base \
        cmake \
        coreutils \
        libaio-dev \
        libressl-dev \
        linux-headers \
        ncurses-dev \
        patch \
        readline-dev \
        zlib-dev




# fix some environmental items
RUN mkdir -p /usr/include/bits; mkdir -p /usr/
COPY wordsize.h /usr/include/bits/wordsize.h


RUN cd /tmp; git clone https://github.com/libcheck/check.git ; cd check; mkdir build ; cd build ; cmake ../ ; make ; make install ;

RUN cd /tmp && git clone -b mariadb-3.x https://github.com/MariaDB/galera.git

RUN cd /tmp/galera && sed -i s/PAGE_SIZE/PAGE_SIZE_64K/g galerautils/src/gu_alloc.cpp && sed -i '/#include <limits>/a #include <stdint.h>' galerautils/src/gu_datetime.hpp

RUN cd /tmp/galera && ./scripts/build.sh --so strict_build_flags=0
RUN find /tmp -name  libgalera_smm.so
RUN mkdir -p /usr/lib64/galera && mv /tmp/galera/libgalera_smm.so /usr/lib64/galera/libgalera_smm.so

COPY root /

COPY docker-entrypoint.sh /lagoon/entrypoints/85-mariadb-entrypoint
RUN rm /lagoon/entrypoints/90-mariadb-entrypoint

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["mysqld"]
