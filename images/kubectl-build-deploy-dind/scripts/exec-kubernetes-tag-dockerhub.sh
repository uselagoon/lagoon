#!/bin/bash
oc --insecure-skip-tls-verify -n ${NAMESPACE} tag --reference-policy=local --source=docker ${PULL_IMAGE} ${NAMESPACE}/${IMAGE_NAME}:latest
