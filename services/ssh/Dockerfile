ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} AS commons
FROM ubuntu:22.04

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

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y curl build-essential ssh curl vim jq python3-jwt

ENV LAGOON=ssh \
    KUBECTL_VERSION=v1.25.0 \
    TZ=UTC

RUN architecture=$(case $(uname -m) in x86_64 | amd64) echo "amd64" ;; aarch64 | arm64 | armv8) echo "arm64" ;; *) echo "amd64" ;; esac) \
    && curl -Lo kubectl "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${architecture}/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/bin/kubectl

RUN architecture=$(case $(uname -m) in x86_64 | amd64) echo "amd64" ;; aarch64 | arm64 | armv8) echo "arm64" ;; *) echo "amd64" ;; esac) \
    && curl -sL https://github.com/krallin/tini/releases/download/v0.19.0/tini-${architecture} -o /sbin/tini && chmod a+x /sbin/tini

COPY services/ssh/libnss-ato-master.tar.gz /tmp/libnss-ato-master.tar.gz

RUN mkdir /tmp/libnss-ato \
    && tar -xzf /tmp/libnss-ato-master.tar.gz -C /tmp/libnss-ato --strip-components=1 \
    && cd /tmp/libnss-ato/ \
    && make \
    && make install \
    && rm -rf /tmp/libnss-ato-master.tar.gz /tmp/libnss-ato

RUN apt-get remove --purge -y build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Reproduce behavior of Alpine: Run Bash as sh
RUN rm -f /bin/sh && ln -s /bin/bash /bin/sh

COPY services/ssh/etc/ /etc/
COPY services/ssh/home/ /home/

# token.sh needs some envplating, so we fix permissions
RUN fix-permissions /home/token.sh
RUN fix-permissions /home/grant.sh

RUN fix-permissions /etc/ssh/ && \
    fix-permissions /run/

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
