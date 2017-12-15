#!/bin/bash

if [ -n "$ROUTER_URL" ]; then
  SERVICE_ROUTER_URL=${SERVICE_NAME}.${ROUTER_URL}
else
  SERVICE_ROUTER_URL=""
fi

if [ ${#TEMPLATE_PARAMETERS[@]} -eq 0 ]; then
    TEMPLATE_PARAMETERS_JOINED=""
else
    TEMPLATE_PARAMETERS_JOINED=$(join_by " -p " "${TEMPLATE_PARAMETERS[@]}")
    # TEMPLATE_PARAMETERS_JOINED has '-p' only between the array elements, but we need it also in the beginning
    TEMPLATE_PARAMETERS_JOINED=" -p ${TEMPLATE_PARAMETERS_JOINED}"
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
  ${TEMPLATE_PARAMETERS_JOINED} \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -
