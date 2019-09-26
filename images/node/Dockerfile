ARG NODE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM node:${NODE_VERSION}-alpine

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

RUN if [ ${NODE_VERSION%.*.*} == "9" ] || [ ${NODE_VERSION%.*.*} == "6" ] ; then \
    echo echo \"Node Version ${NODE_VERSION} is end of life and should no longer be used. For more information, visit https://nodejs.org/en/about/releases/\" \> /dev/stderr >> /home/.bashrc ; fi

RUN if [ ${NODE_VERSION%.*.*} == "8" ] ; then \
    echo echo \"Node Version ${NODE_VERSION} will be end of life after 2019-12-31 - Please consider updating to v10 or v12. For more information, visit https://nodejs.org/en/about/releases/\" \> /dev/stderr >> /home/.bashrc ; fi

WORKDIR /app

EXPOSE 3000

# tells the local development environment on which port we are running
ENV LAGOON_LOCALDEV_HTTP_PORT=3000

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["yarn", "run", "start"]
