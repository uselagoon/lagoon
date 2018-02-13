#!/bin/bash
oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} tag ${PROMOTION_SOURCE_OPENSHIFT_PROJECT}/${IMAGE_NAME}:latest ${OPENSHIFT_PROJECT}/${IMAGE_NAME}:latest
