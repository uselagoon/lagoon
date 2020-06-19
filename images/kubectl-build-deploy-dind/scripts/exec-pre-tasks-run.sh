#!/bin/bash

# if there is a deployment for the given service
if [[ $(kubectl -n ${NAMESPACE} get deploy --no-headers=true -o name -l lagoon.sh/service=${SERVICE_NAME}| wc -l) -gt 0 ]]; then
  DEPLOYMENTCONFIG=$(kubectl -n ${NAMESPACE} get deploy -l lagoon.sh/service=${SERVICE_NAME} -o name)
  # check if deploymenconfig has at least 1 ready pod, if not, scale and check again in 3 secounds.
  while [[ $(kubectl -n ${NAMESPACE} get ${DEPLOYMENTCONFIG} -o go-template --template='{{.status.readyReplicas}}') = "<no value>" ]] || [[ $(kubectl -n ${NAMESPACE} get ${DEPLOYMENTCONFIG} -o go-template --template='{{.status.readyReplicas}}') = "0" ]]
  do
    # Sending the scaling command while it already scaling is no problem for the Kubernetes API
    kubectl -n ${NAMESPACE} scale --replicas=1 ${DEPLOYMENTCONFIG}
    sleep 3
  done
fi

POD=$(kubectl -n ${NAMESPACE} get pods -l lagoon.sh/service=${SERVICE_NAME} -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')

if [[ ! $POD ]]; then
  echo "No running pod found for ${SERVICE_NAME}, skipping"
else

  if [[ $CONTAINER == "false" ]]; then
    CONTAINER_PARAMETER=""
  else
    CONTAINER_PARAMETER="-c ${CONTAINER}"
  fi

  kubectl -n ${NAMESPACE} exec ${POD} ${CONTAINER_PARAMETER} -i -- ${SHELL} -c "${COMMAND}"

fi
