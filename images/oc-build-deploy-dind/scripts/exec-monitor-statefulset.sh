#!/bin/bash

REPLICAS=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get statefulset "${STATEFULSET}" -o=go-template --template='{{.spec.replicas}}')
MAX_WAIT_SECONDS=600
END=$((SECONDS+$MAX_WAIT_SECONDS))

while true; do
    if [[ $SECONDS -gt $END ]]; then
      echo "Statefulset '${STATEFULSET}' was not fully scaled within $MAX_WAIT_SECONDS seconds"
      exit
    fi

    READY_REPLICAS=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get statefulset "${STATEFULSET}" -o=go-template --template='{{.status.readyReplicas}}')
    if [[ $READY_REPLICAS == $REPLICAS ]]; then
      echo "Statefulset '${STATEFULSET}' ready: $READY_REPLICAS of $REPLICAS ready"
      break
    else
      echo "Statefulset '${STATEFULSET}' not ready yet: $READY_REPLICAS of $REPLICAS ready, waiting..."
    fi

    sleep 10
done
