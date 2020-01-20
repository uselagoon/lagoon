#!/bin/bash

docker tag ${TEMPORARY_IMAGE_NAME} ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG:-latest}

IMAGE_HASHES[${IMAGE_NAME}]=$(docker inspect ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG:-latest} --format '{{index .RepoDigests 0}}')

echo "docker push ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG:-latest}" >> /kubectl-build-deploy/lagoon/push

