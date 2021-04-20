ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} as commons
FROM golang:1.13-alpine3.12 as golang

RUN apk add --no-cache git
RUN go get github.com/a8m/envsubst/cmd/envsubst

FROM docker:19.03.14

LABEL maintainer="amazee.io"
ENV LAGOON=oc

COPY --from=golang /go/bin/envsubst /bin/envsubst

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

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

# Defining Versions
ENV KUBECTL_VERSION=v1.20.4 \
    HELM_VERSION=v3.5.2 \
    HELM_SHA256=01b317c506f8b6ad60b11b1dc3f093276bb703281cb1ae01132752253ec706a2

RUN apk add -U --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing aufs-util \
    && apk add --update openssl curl jq parallel \
    && apk add --no-cache bash git openssh py-pip skopeo \
    && git config --global user.email "lagoon@lagoon.io" && git config --global user.name lagoon \
    && pip install shyaml yq \
    && curl -Lo /usr/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl \
    && chmod +x /usr/bin/kubectl \
    && curl -Lo /usr/bin/yq https://github.com/mikefarah/yq/releases/download/3.3.2/yq_linux_amd64 \
    && chmod +x /usr/bin/yq \
    && curl -Lo /usr/bin/svcat https://download.svcat.sh/cli/latest-v0.2/linux/amd64/svcat \
    && chmod +x /usr/bin/svcat \
    && curl -Lo /tmp/helm.tar.gz https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz \
    && echo "${HELM_SHA256}  /tmp/helm.tar.gz" | sha256sum -c -  \
    && mkdir /tmp/helm \
    && tar -xzf /tmp/helm.tar.gz -C /tmp/helm --strip-components=1 \
    && mv /tmp/helm/helm /usr/bin/helm \
    && chmod +x /usr/bin/helm \
    && rm -rf /tmp/helm*


ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
