# build the binary
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:1.24-alpine3.21 AS builder
# bring in all the packages
COPY . /go/src/github.com/uselagoon/lagoon/services/webhooks/
WORKDIR /go/src/github.com/uselagoon/lagoon/services/webhooks/

# compile
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o webhooks cmd/main.go

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# bring the auto-idler binary from the builder
COPY --from=builder /go/src/github.com/uselagoon/lagoon/services/webhooks/webhooks .

ENV LAGOON=webhooks
# set defaults
ENV JWT_SECRET=super-secret-string \
    JWT_AUDIENCE=api.dev \
    GRAPHQL_ENDPOINT="http://api:3000/graphql" \
    RABBITMQ_HOSTNAME=broker:5672 \
    RABBITMQ_USERNAME=guest \
    RABBITMQ_PASSWORD=guest
CMD ["/app/webhooks"]
