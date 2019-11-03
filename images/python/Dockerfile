ARG BASE_VERSION
ARG IMAGE_REPO
ARG ALPINE_VERSION
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM python:${BASE_VERSION}-alpine${ALPINE_VERSION}
ARG BASE_VERSION

LABEL maintainer="amazee.io"
ENV LAGOON=python

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /sbin/tini /sbin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc


RUN apk update \
    && apk upgrade \
    && case ${BASE_VERSION} in \
      2*) \
        apk add --no-cache python-dev \
        py2-pip \
        py2-virtualenv; \
        ;; \
      3*) \
        apk add --no-cache python3-dev \
        py3-virtualenv; \
        ;; \
      esac

# Make sure shells are not running forever
COPY 80-shell-timeout.sh /lagoon/entrypoints/
RUN echo "source /lagoon/entrypoints/80-shell-timeout.sh" >> /home/.bashrc

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["python"]
