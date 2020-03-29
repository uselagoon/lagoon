#!/bin/bash

docker tag ${TEMPORARY_IMAGE_NAME} ${REGISTRY}/${TUG_REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG:-latest}

echo "docker push ${REGISTRY}/${TUG_REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG:-latest}" >> /oc-build-deploy/lagoon/push

