#!/bin/bash
set -x
if ! docker -H ${DOCKER_HOST} info &> /dev/null; then
    echo "could not connect to ${DOCKER_HOST}"; exit 1
fi

# prune all images older than 7 days or what is specified in the environment variable
docker image prune -af --filter "until=${PRUNE_IMAGES_UNTIL:-168h}"
# after old images are pruned, clean up dangling images
docker image prune -f
