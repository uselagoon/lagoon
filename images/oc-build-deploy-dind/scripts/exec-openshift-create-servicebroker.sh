#!/bin/bash

if oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get servicebroker "${SERVICE_NAME}" &> /dev/null; then
  echo "ServiceBroker ${SERVICE_NAME} already existing, not attempting to update"
else
  oc process  --local -o yaml --insecure-skip-tls-verify \
    -n ${OPENSHIFT_PROJECT} \
    -f ${OPENSHIFT_TEMPLATE} \
    -p SERVICE_NAME="${SERVICE_NAME}" \
    -p SAFE_BRANCH="${SAFE_BRANCH}" \
    -p SAFE_PROJECT="${SAFE_PROJECT}" \
    -p BRANCH="${BRANCH}" \
    -p PROJECT="${PROJECT}" \
    -p LAGOON_GIT_SHA="${LAGOON_GIT_SHA}" \
    -p SERVICE_ROUTER_URL="${SERVICE_ROUTER_URL}" \
    -p REGISTRY="${OPENSHIFT_REGISTRY}" \
    -p OPENSHIFT_PROJECT=${OPENSHIFT_PROJECT} \
    "${TEMPLATE_PARAMETERS[@]}" \
    | outputToYaml
fi