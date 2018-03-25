#!/bin/bash

POD=$(oc -n ${OPENSHIFT_PROJECT} get pods -l service=${SERVICE_NAME} -o json | jq -r '.items[] | select(.status.phase == "Running") | .metadata.name' | head -n 1)

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