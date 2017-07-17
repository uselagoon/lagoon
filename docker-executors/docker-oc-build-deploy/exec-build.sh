#!/bin/bash -xe

set -o pipefail

docker build --build-arg IMAGE_REPO=$CI_OVERRIDE_IMAGE_REPO --build-arg AMAZEEIO_GIT_SHA="$AMAZEEIO_GIT_SHA" --build-arg AMAZEEIO_GIT_BRANCH="$BRANCH" --build-arg AMAZEEIO_SITEGROUP="$SITEGROUP" -t $IMAGE-$SERVICE -f $DOCKERFILE $BUILD_CONTEXT
