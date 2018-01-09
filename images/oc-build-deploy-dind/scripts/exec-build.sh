#!/bin/bash

# try to pull the last pushed image so we can use it for --cache-from during the build
docker build --network=host "${BUILD_ARGS[@]}" --build-arg IMAGE_REPO=$CI_OVERRIDE_IMAGE_REPO --build-arg LAGOON_GIT_SHA="$LAGOON_GIT_SHA" --build-arg LAGOON_GIT_BRANCH="$BRANCH" --build-arg LAGOON_PROJECT="$PROJECT" -t $TEMPORARY_IMAGE_NAME -f $BUILD_CONTEXT/$DOCKERFILE $BUILD_CONTEXT
