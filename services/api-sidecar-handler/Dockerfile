# build the binary
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM golang:1.23-alpine3.20 AS builder
# bring in all the packages
COPY . /go/src/github.com/uselagoon/lagoon/services/api-sidecar-handler/
WORKDIR /go/src/github.com/uselagoon/lagoon/services/api-sidecar-handler/

# compile
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o api-sidecar-handler .

# put the binary into container
# use the commons image to get entrypoints
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/
COPY --from=builder /go/src/github.com/uselagoon/lagoon/services/api-sidecar-handler/api-sidecar-handler .

ENV LAGOON=api-sidecar-handler


ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/app/api-sidecar-handler"]
