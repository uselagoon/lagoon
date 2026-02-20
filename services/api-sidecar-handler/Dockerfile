# build the binary
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:1.25-alpine3.22 AS builder

WORKDIR /workspace
COPY go.mod go.mod
COPY go.sum go.sum
COPY internal/messaging internal/messaging
COPY internal/lagoon internal/lagoon
COPY internal/events internal/events
COPY services/api-sidecar-handler/cmd/ services/api-sidecar-handler/cmd/
COPY services/api-sidecar-handler/internal/server services/api-sidecar-handler/internal/server

# compile
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o api-sidecar-handler services/api-sidecar-handler/cmd/main.go

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# bring the api-sidecar-handler binary from the builder
COPY --from=builder /workspace/api-sidecar-handler .

ENV LAGOON=api-sidecar-handler \
    RABBITMQ_HOST=broker \
    RABBITMQ_PORT=5672 \
    RABBITMQ_USERNAME=guest \
    RABBITMQ_PASSWORD=guest


ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/app/api-sidecar-handler"]
