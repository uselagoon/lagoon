#!/bin/bash

# this script is used to create/update the fastly api secrets

helm template ${FASTLY_API_SECRET_NAME} \
    /kubectl-build-deploy/helmcharts/fastly-api-secret \
    --set fastly.apiToken="${FASTLY_API_TOKEN}" \
    --set fastly.platformTLSConfiguration="${FASTLY_API_PLATFORMTLS_CONFIGURATION}" \
    -f /kubectl-build-deploy/values.yaml "${HELM_ARGUMENTS[@]}" > $YAML_FOLDER/00-${FASTLY_API_SECRET_NAME}.yaml
    ## this api secret needs to exist before the ingress is created, so try prioritise it by putting it numerically ahead of any ingresses

# add the name to the array because it will be used during the ingress steps to ensure that the secret will exist before annotating any
# ingresses that may want to use it
FASTLY_API_SECRETS+=(${FASTLY_API_SECRET_NAME})