#!/bin/bash

# try to pull the last pushed image so we can use it for --cache-from during the build
docker build --network=host "${BUILD_ARGS[@]}" -t $TEMPORARY_IMAGE_NAME -f $BUILD_CONTEXT/$DOCKERFILE $BUILD_CONTEXT
