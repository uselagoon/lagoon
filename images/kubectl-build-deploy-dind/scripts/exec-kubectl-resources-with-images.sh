#!/bin/bash
if [ -n "$ROUTER_URL" ]; then
  SERVICE_ROUTER_URL=${SERVICE_NAME}-${ROUTER_URL}
else
  SERVICE_ROUTER_URL=""
fi


# First check if we need multiple Images in this Template (check for `_SERVICE_IMAGE` - see underline)
if [[ $(helm show values /kubectl-build-deploy/helmcharts/${SERVICE_TYPE} | grep images) ]]; then
  # Inject Pullable Images into Template
  HELM_IMAGE_VALUES=()
  while read line
  do
    # SERVICE_IMAGE Parameters are configured like "[SERVICETYPE]_SERVICE_IMAGE", we split the servicetype away and lowercase it
    DEPLOYMENT_SERVICETYPE=$line

    # Load which pushed image matches this servicetype of this service name
    DEPLOYMENT_SERVICETYPE_IMAGE_NAME="${MAP_DEPLOYMENT_SERVICETYPE_TO_IMAGENAME[${SERVICE_NAME}:${DEPLOYMENT_SERVICETYPE}]}"
    # Load the Image Hash of the loaded Image
    DEPLOYMENT_SERVICETYPE_IMAGE_NAME_HASH="${IMAGE_HASHES[${DEPLOYMENT_SERVICETYPE_IMAGE_NAME}]}"

    # Add the Image Hash as Parameter of "[SERVICETYPE]_SERVICE_IMAGE"
    HELM_IMAGE_VALUES+=(--set "images.${line}=${DEPLOYMENT_SERVICETYPE_IMAGE_NAME_HASH}")
  done < <(cat /kubectl-build-deploy/helmcharts/${SERVICE_TYPE}/values.yaml | shyaml keys images)
  helm template ${SERVICE_NAME} /kubectl-build-deploy/helmcharts/${SERVICE_TYPE} -f /kubectl-build-deploy/values.yaml --set service_name="${SERVICE_NAME}"  "${HELM_IMAGE_VALUES[@]}" | outputToYaml

# check if we need a single image to inject
elif [[ $(helm show values /kubectl-build-deploy/helmcharts/${SERVICE_TYPE} | grep image) ]]; then
  SERVICE_NAME_IMAGE="${MAP_SERVICE_NAME_TO_IMAGENAME[${SERVICE_NAME}]}"
  SERVICE_NAME_IMAGE_HASH="${IMAGE_HASHES[${SERVICE_NAME_IMAGE}]}"
  helm template ${SERVICE_NAME} /kubectl-build-deploy/helmcharts/${SERVICE_TYPE} -f /kubectl-build-deploy/values.yaml --set image="${SERVICE_NAME_IMAGE_HASH}" | outputToYaml
fi

if [[ $(helm show values /kubectl-build-deploy/helmcharts/${SERVICE_TYPE} | grep environment_type ) ]]; then
  helm template ${SERVICE_NAME} /kubectl-build-deploy/helmcharts/${SERVICE_TYPE} -f /kubectl-build-deploy/values.yaml --set environment_type="${ENVIRONMENT_TYPE}" | outputToYaml
fi


# oc process  --local -o yaml --insecure-skip-tls-verify \
#   -n ${NAMESPACE} \
#   -f ${OPENSHIFT_TEMPLATE} \
#   -p SERVICE_NAME="${SERVICE_NAME}" \
#   -p SAFE_BRANCH="${SAFE_BRANCH}" \
#   -p SAFE_PROJECT="${SAFE_PROJECT}" \
#   -p BRANCH="${BRANCH}" \
#   -p PROJECT="${PROJECT}" \
#   -p LAGOON_GIT_SHA="${LAGOON_GIT_SHA}" \
#   -p SERVICE_ROUTER_URL="${SERVICE_ROUTER_URL}" \
#   -p REGISTRY="${REGISTRY}" \
#   -p NAMESPACE=${NAMESPACE} \
#   "${TEMPLATE_PARAMETERS[@]}" \
#   "${TEMPLATE_ADDITIONAL_PARAMETERS[@]}" \
#   | outputToYaml
