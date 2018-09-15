ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM arachnysdocker/athenapdf-service:2.13.0

MAINTAINER amazee.io
ENV LAGOON=athenapdf-service

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# Reproduce behavior of Alpine: Run Bash as sh
RUN rm -f /bin/sh && ln -s /bin/bash /bin/sh

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

ENV WEAVER_ATHENA_CMD="athenapdf --no-cache --ignore-certificate-errors -S"
ENV WEAVER_AUTH_KEY=lagoon-athenapdf

COPY entrypoint.sh /athenapdf-service/conf/entrypoint.sh
