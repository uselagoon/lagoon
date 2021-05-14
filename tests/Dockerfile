ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/python-2.7:${UPSTREAM_TAG:-latest}

RUN apk add --no-cache \
      bash \
      curl \
      gettext \
      git \
      jq \
      moreutils \
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
# https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.20.md#downloads-for-v1204
ARG KUBECTL_URL=https://dl.k8s.io/v1.20.4/kubernetes-client-linux-amd64.tar.gz
ARG KUBECTL_SHA512=daf1ec0cbd14885170a51d2a09bf652bfaa4d26925c1b4babdc427d2a2903b1a295403320229cde2b415fee65a5af22671afa926f184cf198df7f17a27f19394
# curl -> tee -> sha512sum -> grep
#            `-> tar
RUN { { curl -sSL $KUBECTL_URL | tee /dev/fd/3 | sha512sum >&4; } 3>&1 | tar -xz --strip-components=3 -C /usr/local/bin kubernetes/client/bin/kubectl; } 4>&1 | grep -q $KUBECTL_SHA512

RUN git config --global user.email "deploytest@amazee.io" && git config --global user.name deploytest

WORKDIR /ansible
COPY . /ansible

COPY hosts /etc/ansible/hosts

ENV ANSIBLE_FORCE_COLOR=true
ENV SSH_AUTH_SOCK=/tmp/ssh-agent
ENV KEYCLOAK_URL=http://keycloak:8080
ENV JWTSECRET=super-secret-string
ENV JWTAUDIENCE=api.dev

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
