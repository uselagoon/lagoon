#!/bin/bash

# if there is a deploymentconfig for the given service
if [[ "oc -n ${OPENSHIFT_PROJECT} get deploymentconfigs -l service=${SERVICE_NAME}" ]]; then
  DEPLOYMENTCONFIG=$(oc -n ${OPENSHIFT_PROJECT} get deploymentconfigs -l service=${SERVICE_NAME} -o name)
  # If the deploymentconfig is scaled to 0, scale to 1
  if [[ $(oc -n ${OPENSHIFT_PROJECT} get ${DEPLOYMENTCONFIG} -o go-template --template='{{.status.replicas}}') == "0" ]]; then

    oc -n ${OPENSHIFT_PROJECT} scale --replicas=1 ${DEPLOYMENTCONFIG} >/dev/null 2>&1
    # wait until the scaling is done
    while [[ ! $(oc -n ${OPENSHIFT_PROJECT}-n ${OPENSHIFT_PROJECT} get ${DEPLOYMENTCONFIG} -o go-template --template='{{.status.readyReplicas}}') == "1" ]]
    do
      sleep 1
    done
  fi
fi

POD=$(oc -n ${OPENSHIFT_PROJECT} get pods -l service=${SERVICE_NAME} -o json | jq -r '.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running") | .metadata.name' | head -n 1)

if [[ ! $POD ]]; then
  echo "No running pod found for ${SERVICE_NAME}"
  exit 1
fi

if [[ $CONTAINER == "false" ]]; then
  CONTAINER_PARAMETER=""
else
  CONTAINER_PARAMETER="-c ${CONTAINER}"
fi

oc -n ${OPENSHIFT_PROJECT} exec ${POD} ${CONTAINER_PARAMETER} -i -- ${SHELL} -c "${COMMAND}"