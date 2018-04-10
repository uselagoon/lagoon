#!/bin/bash

if [ -n "$ROUTER_URL" ]; then
  SERVICE_ROUTER_URL=${SERVICE_NAME}.${ROUTER_URL}
else
  SERVICE_ROUTER_URL=""
fi

JSON=$(oc process --insecure-skip-tls-verify \
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
  "${TEMPLATE_PARAMETERS[@]}")

# If the deploymentconfig already exists, remove `image` from all DeploymentConfig Container definition
# As setting this causes OpenShift => 3.7 to think the image has changed even though there is an ImageTrigger
if oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get dc "$SERVICE_NAME" &> /dev/null; then
  echo "$JSON" | jq --raw-output 'del(.items[].spec.template.spec.containers[]?.image)' | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -
else
  echo "$JSON" | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -
fi