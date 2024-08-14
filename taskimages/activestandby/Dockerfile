# Build the binary
FROM golang:1.22-alpine3.20 AS builder

COPY . /go/src/github.com/uselagoon/lagoon/taskimages/activestandby/
WORKDIR /go/src/github.com/uselagoon/lagoon/taskimages/activestandby/

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go test -v ./...
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${ARCH} go build -a -o taskrunner .

# Use distroless as minimal base image to package the binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /go/src/github.com/uselagoon/lagoon/taskimages/activestandby/taskrunner .
USER nonroot:nonroot

ENTRYPOINT ["/taskrunner"]
