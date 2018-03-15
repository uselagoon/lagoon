#!/bin/bash

docker tag ${TEMPORARY_IMAGE_NAME} ${OPENSHIFT_REGISTRY}/${REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG:-latest}

for i in {1..4}; do docker push ${OPENSHIFT_REGISTRY}/${REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG:-latest} && break || sleep 5; done

