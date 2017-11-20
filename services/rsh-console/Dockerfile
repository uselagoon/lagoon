ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM alpine:latest

ENV OC_VERSION=v3.6.0 \
    OC_HASH=c4dd4cf \
		OC_SHA256=ecb0f52560ac766331052a0052b1de646011247f637c15063f4d74432e1ce389 \
		GLIBC_VERSION=2.25-r0


MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home/.bashrc /home/.bashrc

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN apk add --no-cache openssh openssl curl bash

# Required for our create_jwt.sh
RUN curl -sLo /bin/jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64 \
    && chmod +x /bin/jq

# Generate ssh server keys
RUN mkdir .ssh && \
    ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -N '' && \
    ssh-keygen -t ecdsa -f /etc/ssh/ssh_host_ecdsa_key -N '' && \
    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ''


# Add the ssh config
COPY services/auth-ssh/sshd_config /etc/ssh/sshd_config

RUN fix-permissions /etc/ssh/ && \
    fix-permissions /run/

RUN chmod 600 /etc/ssh/ssh_host_rsa_key  /etc/ssh/ssh_host_ecdsa_key /etc/ssh/ssh_host_ed25519_key
# This is the script that is run on every ssh login attempt. It
# calls the authentication server to retrieve a token, it is
# envplated during entrypoint so fix permissions

COPY services/auth-ssh/get-jwt-token.sh /home/get-jwt-token.sh
RUN fix-permissions /home/get-jwt-token.sh

# This is the authorized keys command, which will be defined as AuthorizedKeysCommand
COPY services/auth-ssh/authorize.sh /authorize.sh
COPY services/auth-ssh/create_jwt.sh /create_jwt.sh

# Files defined in AuthorizedKeysCommand need the specific permissions for
# root to own and no write permission by group or others
RUN chmod 755 /authorize.sh
RUN chmod 755 /create_jwt.sh

# Create /authorize.env file and give api right to write it, it will be filled
# within docker-entrypoint with all environment variables and then sourced
# by /authorize.sh
RUN touch /authorize.env && fix-permissions /authorize.env

# Create empty authorized_keys file, just that openssh does not complain all the time
RUN mkdir -p /home/.ssh && touch /home/.ssh/authorized_keys

# This will set the username of the random generated user by openshift to 'api' (see 10-passwd.sh)
ENV USER_NAME api

# Entrypoint file which will replace some environment variables into
# hardcoded values every time the container is started
COPY services/auth-ssh/docker-entrypoint.sh /lagoon/entrypoints/99-envplate.sh

RUN apk add -U --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing aufs-util && \
		apk add --update curl && \
		curl -Lo /etc/apk/keys/sgerrand.rsa.pub https://raw.githubusercontent.com/sgerrand/alpine-pkg-glibc/master/sgerrand.rsa.pub && \
		curl -Lo glibc.apk "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VERSION}/glibc-${GLIBC_VERSION}.apk" && \
		curl -Lo glibc-bin.apk "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VERSION}/glibc-bin-${GLIBC_VERSION}.apk" && \
		apk add glibc-bin.apk glibc.apk && \
		/usr/glibc-compat/sbin/ldconfig /lib /usr/glibc-compat/lib && \
		echo 'hosts: files mdns4_minimal [NOTFOUND=return] dns mdns4' >> /etc/nsswitch.conf && \
		rm -rf glibc.apk glibc-bin.apk /var/cache/apk/*  && \
    apk add --no-cache bash git && \
    git config --global user.email "lagoon@lagoon.io" && git config --global user.name lagoon && \
    mkdir -p /openshift-origin-client-tools && \
    curl -Lo /tmp/openshift-origin-client-tools.tar https://github.com/openshift/origin/releases/download/${OC_VERSION}/openshift-origin-client-tools-${OC_VERSION}-${OC_HASH}-linux-64bit.tar.gz && \
    echo "$OC_SHA256  /tmp/openshift-origin-client-tools.tar" | sha256sum -c -  && \
    mkdir /tmp/openshift-origin-client-tools && \
    tar -xzf /tmp/openshift-origin-client-tools.tar -C /tmp/openshift-origin-client-tools --strip-components=1 && \
    install /tmp/openshift-origin-client-tools/oc /usr/bin/oc && rm -rf /tmp/openshift-origin-client-tools  && rm -rf /tmp/openshift-origin-client-tools.tar


# Global lagoon default environment variables
COPY .env.defaults .

EXPOSE 2020

ENTRYPOINT ["/lagoon/entrypoints.sh"]
CMD ["/usr/sbin/sshd", "-e", "-D", "-f", "/etc/ssh/sshd_config"]
