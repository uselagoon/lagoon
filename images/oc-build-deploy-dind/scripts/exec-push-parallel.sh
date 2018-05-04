#!/bin/bash

docker tag ${TEMPORARY_IMAGE_NAME} ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NAME}:latest

echo "docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NAME}:latest" >> /oc-build-deploy/lagoon/push

