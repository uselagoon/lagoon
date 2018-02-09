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
# replace poll.h with one that doesn't break the build
RUN mkdir /usr/include/sys/ ; echo "#include <poll.h>" > /usr/include/sys/poll.h
RUN cat /usr/include/sys/poll.h


RUN cd /tmp; git clone https://github.com/libcheck/check.git ; cd check; mkdir build ; cd build ; cmake ../ ; make ; make install ;
#RUN cd /tmp && git clone -b mariadb-3.x qhttps://github.com/MariaDB/galera.git && cd galera && ./scripts/build.sh
# RUN find /tmp/galera ; find \*.so


# COPY root /

# COPY docker-entrypoint.sh /lagoon/entrypoints/85-mariadb-entrypoint
# RUN rm /lagoon/entrypoints/90-mariadb-entrypoint

ENTRYPOINT /bin/sh
