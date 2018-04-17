#!/bin/bash
oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} tag --source=docker ${PULL_IMAGE} ${OPENSHIFT_PROJECT}/${IMAGE_NAME}:latest
