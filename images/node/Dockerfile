ARG BASE_VERSION
ARG ALPINE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM node:${BASE_VERSION}-alpine${ALPINE_VERSION}

LABEL maintainer="amazee.io"
ENV LAGOON=node

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /sbin/tini /sbin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home \
    && fix-permissions /home \
    && mkdir -p /app \
    && fix-permissions /app

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc

RUN apk update \
    && apk upgrade \
    && rm -rf /var/cache/apk/*

# Make sure Bower and NPM are allowed to be running as root
RUN echo '{ "allow_root": true }' > /home/.bowerrc \
    && echo 'unsafe-perm=true' > /home/.npmrc

WORKDIR /app

EXPOSE 3000

# tells the local development environment on which port we are running
ENV LAGOON_LOCALDEV_HTTP_PORT=3000

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["yarn", "run", "start"]
