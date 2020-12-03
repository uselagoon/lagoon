#!/bin/bash -e
set -x

if ! docker -H ${DOCKER_HOST} info &> /dev/null; then
    echo "could not connect to ${DOCKER_HOST}"; exit 1
fi

# Iterates through all images that have the name of the repository we are interested in in it
for FULL_IMAGE in $(docker image ls --format "{{.Repository}}:{{.Tag}}" | grep -E "${REPOSITORY_TO_UPDATE}/" | grep -v none); do
  # pull newest version of found image
  docker pull ${FULL_IMAGE} | cat
done
