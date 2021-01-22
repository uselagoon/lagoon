ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} as commons
FROM ubuntu:18.04

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

LABEL maintainer="amazee.io"

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
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

ENV LAGOON=ssh \
    OC_VERSION=v3.11.0 \
    OC_HASH=0cbc58b \
    OC_SHA256=4b0f07428ba854174c58d2e38287e5402964c9a9355f6c359d1242efd0990da3

COPY services/ssh/libnss-mysql-1.5.tar.gz /tmp/libnss-mysql-1.5.tar.gz

RUN apt-get update \
    && apt-get install -y curl build-essential libmysqlclient-dev ssh curl vim jq python3-jwt \
    && ln -s /usr/lib/x86_64-linux-gnu/libmysqlclient.so /usr/lib/libmysqlclient.so \
    && mkdir /tmp/libnss-mysql \
    && tar -xzf /tmp/libnss-mysql-1.5.tar.gz -C /tmp/libnss-mysql --strip-components=1 \
    && cd /tmp/libnss-mysql \
    && ./configure \
    && make \
    && make install \
    && apt-get remove --purge -y build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* /tmp/libnss-mysql-1.5.tar.gz /tmp/libnss-mysql

RUN mkdir -p /openshift-origin-client-tools && \
    curl -Lo /tmp/openshift-origin-client-tools.tar https://github.com/openshift/origin/releases/download/${OC_VERSION}/openshift-origin-client-tools-${OC_VERSION}-${OC_HASH}-linux-64bit.tar.gz && \
    echo "$OC_SHA256  /tmp/openshift-origin-client-tools.tar" | sha256sum -c -  && \
    mkdir /tmp/openshift-origin-client-tools && \
    tar -xzf /tmp/openshift-origin-client-tools.tar -C /tmp/openshift-origin-client-tools --strip-components=1 && \
    install /tmp/openshift-origin-client-tools/oc /usr/bin/oc && rm -rf /tmp/openshift-origin-client-tools  && rm -rf /tmp/openshift-origin-client-tools.tar

RUN curl -L https://github.com/krallin/tini/releases/download/v0.18.0/tini -o /sbin/tini && chmod a+x /sbin/tini

# Reproduce behavior of Alpine: Run Bash as sh
RUN rm -f /bin/sh && ln -s /bin/bash /bin/sh

COPY services/ssh/etc/ /etc/
COPY services/ssh/home/ /home/

# token.sh needs some envplating, so we fix permissions
RUN fix-permissions /home/token.sh
RUN fix-permissions /home/grant.sh

RUN fix-permissions /etc/ssh/ && \
    fix-permissions /run/ && \
    fix-permissions /etc/libnss-mysql.cfg && \
    fix-permissions /etc/libnss-mysql-root.cfg

RUN mkdir -p /var/run/sshd && chmod 700 /var/run/sshd

# This is the authorized keys command, which will be defined as AuthorizedKeysCommand
COPY services/ssh/authorize.sh /authorize.sh

# Files defined in AuthorizedKeysCommand need the specific permissions for
# root to own and no write permission by group or others
RUN chmod 755 /authorize.sh

# create_60_sec_jwt to create a JWT Admin Token which is valid for 60 secs
COPY services/ssh/create_60_sec_jwt.py /create_60_sec_jwt.py

# Create /authorize.env file and give api right to write it, it will be filled
# within docker-entrypoint with all environment variables and then sourced
# by /authorize.sh
RUN touch /authorize.env && fix-permissions /authorize.env

# Setup folder for oc to save it's credentials
RUN mkdir -p /home/.kube && fix-permissions /home/.kube

# This will set the username of the random generated user by openshift to 'api' (see 10-passwd.sh)
ENV USER_NAME lagoon

# Entrypoint file which will replace some environment variables into
# hardcoded values every time the container is started
COPY services/ssh/docker-entrypoint.sh /lagoon/entrypoints/99-envplate.sh

# Global lagoon default environment variables
COPY .env.defaults .

ENV AUTH_SERVER=http://auth-server:3000 \
    API_HOST=http://api:3000

EXPOSE 2020

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/usr/sbin/sshd", "-e", "-D", "-f", "/etc/ssh/sshd_config"]
