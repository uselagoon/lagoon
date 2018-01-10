#!/bin/bash

if [ -n "$ROUTER_URL" ]; then
  SERVICE_ROUTER_URL=${SERVICE_NAME}.${ROUTER_URL}
else
  SERVICE_ROUTER_URL=""
fi

oc process --insecure-skip-tls-verify \
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
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -
