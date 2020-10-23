ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/python-2.7:${UPSTREAM_TAG:-latest}

RUN apk add --no-cache \
      bash \
      curl \
      git \
      jq \
      openssh-client \
      rsync

RUN apk add --no-cache --virtual .build-deps \
      g++ \
      libffi-dev \
      openssl-dev \
    && pip install \
      ansible==2.8.13 \
      PyJWT \
      requests \
      jmespath \
    && apk del .build-deps

# download, extract and install kubectl binary
# https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.18.md#downloads-for-v1182
ARG KUBECTL_URL=https://dl.k8s.io/v1.18.2/kubernetes-client-linux-amd64.tar.gz
ARG KUBECTL_SHA512=ed36f49e19d8e0a98add7f10f981feda8e59d32a8cb41a3ac6abdfb2491b3b5b3b6e0b00087525aa8473ed07c0e8a171ad43f311ab041dcc40f72b36fa78af95
# curl -> tee -> sha512sum -> grep
#            `-> tar
RUN { { curl -sSL $KUBECTL_URL | tee /dev/fd/3 | sha512sum >&4; } 3>&1 | tar -xz --strip-components=3 -C /usr/local/bin kubernetes/client/bin/kubectl; } 4>&1 | grep -q $KUBECTL_SHA512

RUN git config --global user.email "deploytest@amazee.io" && git config --global user.name deploytest

WORKDIR /ansible
COPY . /ansible

COPY hosts /etc/ansible/hosts

ENV ANSIBLE_FORCE_COLOR=true
ENV SSH_AUTH_SOCK=/tmp/ssh-agent

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
