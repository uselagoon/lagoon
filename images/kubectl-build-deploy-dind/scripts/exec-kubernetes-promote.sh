#!/bin/bash
skopeo copy --retry-times 5 --src-tls-verify=false --dest-tls-verify=false docker://${REGISTRY}/${PROJECT}/${PROMOTION_SOURCE_ENVIRONMENT}/${IMAGE_NAME}:${IMAGE_TAG:-latest} docker://${REGISTRY}/${PROJECT}/${ENVIRONMENT}/${IMAGE_NAME}:${IMAGE_TAG:-latest}
