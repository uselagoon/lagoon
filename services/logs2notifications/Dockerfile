# build the binary
ARG GO_VERSION
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:${GO_VERSION:-1.13.8} AS builder
# bring in all the packages
COPY . /go/src/github.com/uselagoon/lagoon/services/logs2notifications/
WORKDIR /go/src/github.com/uselagoon/lagoon/services/logs2notifications/

# tests currently don't work because mocking rabbit is interesting
RUN GO111MODULE=on go test ./...
# compile
RUN CGO_ENABLED=0  GOOS=linux GOARCH=amd64 go build -a -o logs2notifications .

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# bring the auto-idler binary from the builder
COPY --from=builder /go/src/github.com/uselagoon/lagoon/services/logs2notifications/logs2notifications .

ENV LAGOON=logs2notifications
# set defaults
ENV JWT_SECRET=super-secret-string \
    JWT_AUDIENCE=api.dev \
    GRAPHQL_ENDPOINT="http://api:3000/graphql" \
    RABBITMQ_ADDRESS=broker \
    RABBITMQ_PORT=5672 \
    RABBITMQ_USERNAME=guest \
    RABBITMQ_PASSWORD=guest

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/app/logs2notifications"]