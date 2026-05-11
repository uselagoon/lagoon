# Build the binary
FROM --platform=linux/amd64 golang:1.25-alpine3.22 AS builder
ARG TARGETARCH

COPY . /go/src/github.com/uselagoon/lagoon/taskimages/activestandby/
WORKDIR /go/src/github.com/uselagoon/lagoon/taskimages/activestandby/

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} go build -a -o taskrunner .

# Use distroless as minimal base image to package the binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /go/src/github.com/uselagoon/lagoon/taskimages/activestandby/taskrunner .
USER nonroot:nonroot

ENTRYPOINT ["/taskrunner"]
