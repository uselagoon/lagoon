# build the binary
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:1.23-alpine3.20 AS builder
# bring in all the packages
COPY . /go/src/github.com/uselagoon/lagoon/services/actions-handler/
WORKDIR /go/src/github.com/uselagoon/lagoon/services/actions-handler/

# compile
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o actions-handler .

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# bring the actions-handler binary from the builder
COPY --from=builder /go/src/github.com/uselagoon/lagoon/services/actions-handler/actions-handler .

ENV LAGOON=actions-handler
# set defaults
ENV JWT_SECRET=super-secret-string \
    JWT_AUDIENCE=api.dev \
    GRAPHQL_ENDPOINT="http://api:3000/graphql" \
    RABBITMQ_ADDRESS=broker \
    RABBITMQ_PORT=5672 \
    RABBITMQ_USERNAME=guest \
    RABBITMQ_PASSWORD=guest

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/app/actions-handler"]
