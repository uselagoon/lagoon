#!/bin/bash -x
BUILD_TAG=${BUILD_TAG:-lagoon-local-dev}
BUILD_TAG=$(echo "$BUILD_TAG" | tr '[:upper:]' '[:lower:]')

function build {
  docker build $3 --build-arg IMAGE_REPO=$BUILD_TAG -t "$2" -f $1/Dockerfile $1
}

build 'centos:7' "$BUILD_TAG/centos:7" "--pull"
build 'centos7-node:6' "$BUILD_TAG/centos7-node:6"
build 'centos7-node:8' "$BUILD_TAG/centos7-node:8"
build 'centos7-node-builder:6' "$BUILD_TAG/centos7-node-builder:6"
build 'centos7-node-builder:8' "$BUILD_TAG/centos7-node-builder:8"