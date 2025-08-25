# build the binary
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:1.24-alpine3.21 AS builder

WORKDIR /workspace
COPY go.mod go.mod
COPY go.sum go.sum
COPY services/webhook-handler/cmd/ services/webhook-handler/cmd/
COPY services/webhook-handler/internal/server services/webhook-handler/internal/server
COPY services/webhook-handler/internal/gitlab services/webhook-handler/internal/gitlab
COPY internal/messaging internal/messaging
COPY internal/lagoon internal/lagoon
COPY internal/events internal/events

# compile
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o webhook-handler services/webhook-handler/cmd/main.go

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# bring the webhook-handler binary from the builder
COPY --from=builder /workspace/webhook-handler .

ENV LAGOON=webhook-handler
# set defaults
ENV JWT_SECRET=super-secret-string \
    JWT_AUDIENCE=api.dev \
    GRAPHQL_ENDPOINT="http://api:3000/graphql" \
    RABBITMQ_ADDRESS=broker \
    RABBITMQ_PORT=5672 \
    RABBITMQ_USERNAME=guest \
    RABBITMQ_PASSWORD=guest
CMD ["/app/webhook-handler"]
