#!/bin/bash

# Only generate PVC if it does not exist yet
if ! oc --insecure-skip-tls-verify -n ${NAMESPACE} get pvc "$PVC_NAME" &> /dev/null; then
    . /oc-build-deploy/scripts/exec-openshift-resources.sh
fi