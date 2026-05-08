FROM golang:1.25-alpine AS builder
WORKDIR /workspace
COPY go.mod go.mod
COPY go.sum go.sum
RUN go mod download
COPY main.go main.go

RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} GO111MODULE=on go build -a -o server main.go

FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}
ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home

RUN mkdir -p /home/.ssh \
    && fix-permissions /home/
WORKDIR /
COPY --from=builder /workspace/server .

ENTRYPOINT ["/server"]