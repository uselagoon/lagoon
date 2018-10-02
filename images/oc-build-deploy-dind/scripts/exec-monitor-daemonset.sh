#!/bin/bash

DESIRED_NUMBER=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get daemonset "${DAEMONSET}" -o=go-template --template='{{.status.desiredNumberScheduled}}')
MAX_WAIT_SECONDS=600
END=$((SECONDS+$MAX_WAIT_SECONDS))

while true; do
    if [[ $SECONDS -gt $END ]]; then
      echo "Daemonset '${DAEMONSET}' was not fully scaled within $MAX_WAIT_SECONDS seconds"
      exit 1
    fi

    NUMBER_READY=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get daemonset "${DAEMONSET}" -o=go-template --template='{{.status.numberReady}}')
    if [[ $NUMBER_READY == $DESIRED_NUMBER ]]; then
      echo "Daemonset '${DAEMONSET}' ready: $NUMBER_READY of $DESIRED_NUMBER ready"
      break
    else
      echo "Daemonset '${DAEMONSET}' not ready yet: $NUMBER_READY of $DESIRED_NUMBER ready, waiting..."
    fi

    sleep 10
done
