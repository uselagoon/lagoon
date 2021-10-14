# build the binary
ARG GO_VERSION
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:${GO_VERSION:-1.13.8} AS builder
# bring in all the packages
# COPY main.go /go/src/github.com/uselagoon/lagoon/services/backup-handler/
# COPY go.mod /go/src/github.com/uselagoon/lagoon/services/backup-handler/
# COPY go.sum /go/src/github.com/uselagoon/lagoon/services/backup-handler/
# COPY internal /go/src/github.com/uselagoon/lagoon/services/backup-handler/internal/
COPY . /go/src/github.com/uselagoon/lagoon/services/backup-handler/
WORKDIR /go/src/github.com/uselagoon/lagoon/services/backup-handler/

# tests currently don't work because mocking rabbit is interesting
RUN GO111MODULE=on go test ./...
# compile
RUN CGO_ENABLED=0  GOOS=linux GOARCH=amd64 go build -a -o backup-handler .

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# bring the auto-idler binary from the builder
COPY --from=builder /go/src/github.com/uselagoon/lagoon/services/backup-handler/backup-handler .

ENV LAGOON=backup-handler
# set defaults
ENV JWT_SECRET=super-secret-string \
    JWT_AUDIENCE=api.dev \
    GRAPHQL_ENDPOINT="http://api:3000/graphql" \
    RABBITMQ_ADDRESS=broker \
    RABBITMQ_PORT=5672 \
    RABBITMQ_USERNAME=guest \
    RABBITMQ_PASSWORD=guest \
    HTTP_LISTEN_PORT=3000

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/app/backup-handler"]
