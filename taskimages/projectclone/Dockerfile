# Build the binary
FROM golang:1.25-alpine3.22 AS builder

COPY . /go/src/github.com/uselagoon/lagoon/taskimages/projectclone/
WORKDIR /go/src/github.com/uselagoon/lagoon/taskimages/projectclone/

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o taskrunner .

# Add lagoon-sync - need to test this will work
FROM golang:1.25-alpine3.22 AS syncer
ARG LAGOON_SYNC_GIT_BRANCH
RUN apk add --no-cache git
WORKDIR /go/src/github.com/uselagoon/lagoon-sync
RUN git clone https://github.com/uselagoon/lagoon-sync.git . && \
    git checkout ${LAGOON_SYNC_GIT_BRANCH} && \
    CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -o /lagoon-sync

# Switching to commons image
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}
RUN apk add --no-cache bash \
        openssh-client \
        coreutils \
        findutils \
        git \
        gzip  \
        mariadb-client=~11.4 \
        mariadb-connector-c \
        mongodb-tools \
        openssh-sftp-server \
        patch \
        postgresql-client \
        procps \
        unzip \
    && rm -rf /var/cache/apk/* \
    && ln -s /usr/lib/ssh/sftp-server /usr/local/bin/sftp-server

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home

RUN mkdir -p /home/.ssh \
    && fix-permissions /home/

WORKDIR /
COPY --from=builder /go/src/github.com/uselagoon/lagoon/taskimages/projectclone/taskrunner .
COPY --from=syncer /lagoon-sync /lagoon-sync
COPY .lagoon.yml /home/.lagoon.yml
RUN mkdir /storage

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/taskrunner"]