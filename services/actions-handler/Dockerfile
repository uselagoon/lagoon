# build the binary
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM --platform=linux/amd64 golang:1.26-alpine3.22 AS builder
WORKDIR /workspace
COPY go.mod go.mod
COPY go.sum go.sum
COPY services/actions-handler services/actions-handler

# compile
ARG TARGETOS
ARG TARGETARCH

RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -a -o actions-handler ./services/actions-handler

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# bring the actions-handler binary from the builder
COPY --from=builder /workspace/actions-handler .

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
