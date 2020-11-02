#!/bin/bash
skopeo copy --dest-tls-verify=false docker://${IMAGECACHE_REGISTRY}/${PULL_IMAGE} docker://${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NAME}:${IMAGE_TAG:-latest}

if [ "${INTERNAL_REGISTRY_LOGGED_IN}" = "true" ] ; then
    skopeo copy --dest-tls-verify=false docker://${IMAGECACHE_REGISTRY}/${PULL_IMAGE} docker://${INTERNAL_REGISTRY_URL}/${PROJECT}/${SAFE_BRANCH}/${IMAGE_NAME}:${IMAGE_TAG:-latest}  || true
fi
