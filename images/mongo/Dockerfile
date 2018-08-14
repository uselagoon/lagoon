ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine:edge

MAINTAINER amazee.io
ENV LAGOON=mongo


COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /sbin/tini /sbin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN apk --no-cache add mongodb

RUN mkdir -p /data/db /data/configdb && \
    fix-permissions /data/db && \
    fix-permissions /data/configdb

VOLUME /data/db
EXPOSE 27017 28017

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD [ "mongod", "--bind_ip", "0.0.0.0" ]
