#!/bin/bash

REPLICAS=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get statefulset "${STATEFULSET}" -o=go-template --template='{{.spec.replicas}}')
MAX_WAIT_SECONDS=600
END=$((SECONDS+$MAX_WAIT_SECONDS))

while true; do
    if [[ $SECONDS -gt $END ]]; then
      echo "Statefulset '${STATEFULSET}' was not fully scaled within $MAX_WAIT_SECONDS seconds"
      exit
    fi

    ACTIVE_REPLICAS=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get statefulset "${STATEFULSET}" -o=go-template --template='{{.status.replicas}}')
    if [[ $ACTIVE_REPLICAS -lt $REPLICAS ]]; then
      echo "Statefulset '${STATEFULSET}' not ready yet: $ACTIVE_REPLICAS of $REPLICAS ready, waiting..."
    else
      echo "Statefulset '${STATEFULSET}' ready: $ACTIVE_REPLICAS of $REPLICAS ready"
      break
    fi

    sleep 10
done
