#!/bin/bash -xe

set -o pipefail

function join_by { local d=$1; shift; echo -n "$1"; shift; printf "%s" "${@/#/$d}"; }

if [ ${#BUILD_ARGS[@]} -eq 0 ]; then
    BUILD_ARGS_JOINED=""
else
    BUILD_ARGS_JOINED=$(join_by " --build-arg " "${BUILD_ARGS[@]}")
    # BUILD_ARGS_JOINED has '--build-arg' only between the array elements, but we need it also in the beginning
    BUILD_ARGS_JOINED=" --build-arg ${BUILD_ARGS_JOINED}"
fi

# try to pull the last pushed image so we can use it for --cache-from during the build
docker pull ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NAME}:latest || true
docker build $BUILD_ARGS_JOINED --cache-from $IMAGE_TEMPORARY_NAME --cache-from ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NAME}:latest --build-arg IMAGE_REPO=$CI_OVERRIDE_IMAGE_REPO --build-arg AMAZEEIO_GIT_SHA="$AMAZEEIO_GIT_SHA" --build-arg AMAZEEIO_GIT_BRANCH="$BRANCH" --build-arg AMAZEEIO_SITEGROUP="$SITEGROUP" -t $IMAGE_TEMPORARY_NAME -f $BUILD_CONTEXT/$DOCKERFILE $BUILD_CONTEXT
