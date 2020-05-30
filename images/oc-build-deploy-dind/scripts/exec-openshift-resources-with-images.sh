#!/bin/bash

if [ -n "$ROUTER_URL" ]; then
  SERVICE_ROUTER_URL=${SERVICE_NAME}.${ROUTER_URL}
else
  SERVICE_ROUTER_URL=""
fi

# Inject Pullable Images into Template
TEMPLATE_ADDITIONAL_PARAMETERS=()
# First check if we need multiple Images in this Template (check for `_SERVICE_IMAGE` - see underline)
if [[ $(oc process --local -f ${OPENSHIFT_TEMPLATE} --parameters | grep _SERVICE_IMAGE) ]]; then
  while read line
  do
    # SERVICE_IMAGE Parameters are configured like "[SERVICETYPE]_SERVICE_IMAGE", we split the servicetype away and lowercase it
    DEPLOYMENT_SERVICETYPE=$(echo $line | awk -F_ '{print $1}'  | tr '[:upper:]' '[:lower:]');

    # Load which pushed image matches this servicetype of this service name
    DEPLOYMENT_SERVICETYPE_IMAGE_NAME="${MAP_DEPLOYMENT_SERVICETYPE_TO_IMAGENAME[${SERVICE_NAME}:${DEPLOYMENT_SERVICETYPE}]}"
    # Load the Image Hash of the loaded Image
    DEPLOYMENT_SERVICETYPE_IMAGE_NAME_HASH="${IMAGE_HASHES[${DEPLOYMENT_SERVICETYPE_IMAGE_NAME}]}"
    # Add the Image Hash as Parameter of "[SERVICETYPE]_SERVICE_IMAGE"
    TEMPLATE_ADDITIONAL_PARAMETERS+=(-p "${line}=${DEPLOYMENT_SERVICETYPE_IMAGE_NAME_HASH}")
  done < <(oc process --local -f ${OPENSHIFT_TEMPLATE} --parameters | grep _SERVICE_IMAGE | awk '{ print $1 }')
# check if we need a single image to inject
elif [[ $(oc process --local -f ${OPENSHIFT_TEMPLATE} --parameters | grep SERVICE_IMAGE) ]]; then
  SERVICE_NAME_IMAGE="${MAP_SERVICE_NAME_TO_IMAGENAME[${SERVICE_NAME}]}"
  SERVICE_NAME_IMAGE_HASH="${IMAGE_HASHES[${SERVICE_NAME_IMAGE}]}"
  TEMPLATE_ADDITIONAL_PARAMETERS+=(-p "SERVICE_IMAGE=${SERVICE_NAME_IMAGE_HASH}")
fi

if [[ $(oc process --local -f ${OPENSHIFT_TEMPLATE} --parameters | grep ENVIRONMENT_TYPE) ]]; then
  TEMPLATE_ADDITIONAL_PARAMETERS+=(-p "ENVIRONMENT_TYPE=${ENVIRONMENT_TYPE}")
fi

oc process  --local -o yaml --insecure-skip-tls-verify \
  --ignore-unknown-parameters=true \
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
  -p CONFIG_MAP_SHA=${CONFIG_MAP_SHA} \
  "${TEMPLATE_PARAMETERS[@]}" \
  "${TEMPLATE_ADDITIONAL_PARAMETERS[@]}" \
  | outputToYaml
