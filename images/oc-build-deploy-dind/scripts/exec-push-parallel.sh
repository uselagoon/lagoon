#!/bin/bash

docker tag ${TEMPORARY_IMAGE_NAME} ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NAME}:${IMAGE_TAG:-latest}

echo "docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NAME}:${IMAGE_TAG:-latest}" >> /oc-build-deploy/lagoon/push

if [ ! -z ${INTERNAL_REGISTRY_URL} ] && [ ! -z ${INTERNAL_REGISTRY_USERNAME} ] && [ ! -z ${INTERNAL_REGISTRY_PASSWORD} ] ; then
    docker tag ${TEMPORARY_IMAGE_NAME} ${INTERNAL_REGISTRY_URL}/${PROJECT}/${SAFE_BRANCH}/${IMAGE_NAME}:${IMAGE_TAG:-latest}
    echo "docker push ${INTERNAL_REGISTRY_URL}/${PROJECT}/${SAFE_BRANCH}/${IMAGE_NAME}:${IMAGE_TAG:-latest}" >> /oc-build-deploy/lagoon/push_harbor
fi