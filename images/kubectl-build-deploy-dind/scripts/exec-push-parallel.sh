#!/bin/bash

docker tag ${TEMPORARY_IMAGE_NAME} ${REGISTRY}/${PROJECT}/${ENVIRONMENT}/${IMAGE_NAME}:${IMAGE_TAG:-latest}

# only show final output as push steps are not required
echo "docker push ${REGISTRY}/${PROJECT}/${ENVIRONMENT}/${IMAGE_NAME}:${IMAGE_TAG:-latest} | grep -v -E 'Waiting|Layer already exists|Preparing'" >> /kubectl-build-deploy/lagoon/push

