#!/bin/bash

docker pull ${PULL_IMAGE}
docker tag ${PULL_IMAGE} ${TEMPORARY_IMAGE_NAME}
