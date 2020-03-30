#!/bin/bash
oc --insecure-skip-tls-verify -n ${NAMESPACE} tag ${PROMOTION_SOURCE_NAMESPACE}/${IMAGE_NAME}:latest ${NAMESPACE}/${IMAGE_NAME}:latest
