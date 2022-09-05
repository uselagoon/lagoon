# build the binary
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:1.18-alpine3.16 AS builder
# bring in all the packages
COPY . /go/src/github.com/uselagoon/lagoon/services/logs2notifications/
WORKDIR /go/src/github.com/uselagoon/lagoon/services/logs2notifications/

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
ENV JWTSECRET=super-secret-string \
    JWT_AUDIENCE=api.dev \
    GRAPHQL_ENDPOINT="http://api:3000/graphql" \
    RABBITMQ_HOST=broker \
    RABBITMQ_PORT=5672 \
    RABBITMQ_USERNAME=guest \
    RABBITMQ_PASSWORD=guest
CMD ["/app/logs2notifications"]