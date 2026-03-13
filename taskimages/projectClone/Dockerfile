# Build the binary
FROM golang:1.25-alpine3.22 AS builder

COPY . /go/src/github.com/uselagoon/lagoon/taskimages/projectClone/
WORKDIR /go/src/github.com/uselagoon/lagoon/taskimages/projectClone/

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o taskrunner .

# Add lagoon-sync - need to test this will work
FROM golang:1.25-alpine3.22 AS syncer
RUN apk add --no-cache git
WORKDIR /go/src/github.com/uselagoon/lagoon-sync
RUN git clone https://github.com/uselagoon/lagoon-sync.git . && \
    CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -o /lagoon-sync

# Use distroless as minimal base image to package the binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /go/src/github.com/uselagoon/lagoon/taskimages/projectClone/taskrunner .
COPY --from=syncer /lagoon-sync /lagoon-sync
USER nonroot:nonroot

ENTRYPOINT ["/taskrunner"]
