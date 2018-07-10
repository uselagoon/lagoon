ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine:3.6

MAINTAINER amazee.io
ENV LAGOON=redis

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN apk add --no-cache bash rsyslog

EXPOSE 1514

COPY rsyslog.conf /etc/rsyslog.conf

RUN fix-permissions /etc/rsyslog.conf \
    && fix-permissions /var/run/

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["rsyslogd", "-n"]
