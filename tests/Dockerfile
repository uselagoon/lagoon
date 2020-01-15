FROM alpine:3.10

RUN apk add --no-cache \
      ansible \
      bash \
      curl \
      git \
      libc6-compat \
      openssh-client \
      py2-jwt \
      py2-requests \
      rsync

# download, extract and install oc binary
ARG OC_URL=https://github.com/openshift/origin/releases/download/v3.11.0/openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit.tar.gz
ARG OC_SHA256=4b0f07428ba854174c58d2e38287e5402964c9a9355f6c359d1242efd0990da3
RUN { { curl -sSL $OC_URL | tee /dev/fd/3 | sha256sum >&4; } 3>&1 | tar -xz --strip-components=1 -C /usr/local/bin openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit/oc; } 4>&1 | grep -q $OC_SHA256

RUN git config --global user.email "deploytest@amazee.io" && git config --global user.name deploytest

WORKDIR /ansible
COPY . /ansible

COPY hosts /etc/ansible/hosts

ENV ANSIBLE_FORCE_COLOR=true
ENV SSH_AUTH_SOCK=/tmp/ssh-agent

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
