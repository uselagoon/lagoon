#!/bin/bash -xe

set -o pipefail

oc run cli --quiet --env AMAZEEIO_GIT_SHA="$AMAZEEIO_GIT_SHA" --env AMAZEEIO_GIT_BRANCH="$BRANCH" --rm -i --attach --image="172.30.1.1:5000/$OPENSHIFT_PROJECT/$IMAGE:latest" --image-pull-policy="Always" --restart=Never -- bash -c "${COMMAND}"