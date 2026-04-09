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

# Need to switch to alpine for ssh client
FROM alpine:3.22
RUN apk add --no-cache openssh-client && adduser -D -u 65532 nonroot
RUN adduser -D -u 10000 -G root -h /tmp lagoon
RUN apk add --no-cache bash \
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



WORKDIR /
COPY --from=builder /go/src/github.com/uselagoon/lagoon/taskimages/projectclone/taskrunner .
COPY --from=syncer /lagoon-sync /lagoon-sync
COPY .lagoon.yml /home/nonroot/.lagoon.yml
COPY .my.cnf /home/nonroot/.my.cnf
RUN mkdir /storage && echo "storage not mounted" > /storage/README \
    && chown -R nonroot:nonroot /home/nonroot \
    && chown -R 10000:0 /storage \
    && chmod -R g+w /storage
USER lagoon

ENTRYPOINT ["/taskrunner"]
