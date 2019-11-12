FROM ${IMAGE_REPO:-lagoon}/commons as commons

LABEL maintainer="amazee.io"

RUN apk update \
    && apk upgrade \
    && apk add --no-cache curl ncdu socat ca-certificates openssl perl perl-doc mysql-client\
    && update-ca-certificates \
    && rm -rf /var/cache/apk/* \
    && wget https://raw.githubusercontent.com/major/MySQLTuner-perl/master/mysqltuner.pl -O mysqltuner.pl
