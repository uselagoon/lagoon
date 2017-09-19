#!/bin/bash -xe

set -o pipefail

docker pull ${PULL_IMAGE}
docker tag ${PULL_IMAGE} ${IMAGE_NAME}
