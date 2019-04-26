#!/bin/bash
set -x
if ! docker -H ${DOCKER_HOST} info &> /dev/null; then
    echo "could not connect to ${DOCKER_HOST}"; exit 1
fi

# prune all images older than 7 days
docker image prune -a --filter "until=168h"
