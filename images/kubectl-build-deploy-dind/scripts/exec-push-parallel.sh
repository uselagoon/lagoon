#!/bin/bash

docker tag ${TEMPORARY_IMAGE_NAME} ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG:-latest}

echo "docker push ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG:-latest}" >> /kubectl-build-deploy/lagoon/push

