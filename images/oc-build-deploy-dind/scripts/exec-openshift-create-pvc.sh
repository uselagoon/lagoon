#!/bin/bash

# Only generate PVC if it does not exist yet
if ! oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get pvc "$SERVICE_NAME" &> /dev/null; then
    . /scripts/exec-openshift-resources.sh
fi