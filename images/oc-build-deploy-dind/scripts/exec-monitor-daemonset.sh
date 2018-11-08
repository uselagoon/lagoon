#!/bin/bash

# while the rollout of a new daemonset is running we gatter the logs of the new generated pods and save them in a known location
# in case this rollout fails, we show the logs of the new containers to the user as they might contain information about why
# the rollout has failed
stream_logs_daemonset() {
  set +x
  # load the generation of the new pods
  GENERATION=$(oc -n ${OPENSHIFT_PROJECT} get --insecure-skip-tls-verify daemonset ${DAEMONSET} -o=go-template --template='{{.metadata.generation}}')
  mkdir -p /tmp/oc-build-deploy/logs/container/${DAEMONSET}

  # this runs in a loop forever (until killed)
  while [ 1 ]
  do
    # Gatter all pods and their containers for the current rollout and stream their logs into files
    oc -n ${OPENSHIFT_PROJECT} get --insecure-skip-tls-verify pods -l "pod-template-generation=${GENERATION},service=${DAEMONSET}" -o json | jq -r '.items[] | .metadata.name + " " + .spec.containers[].name' |
    {
      while read -r POD CONTAINER ; do
          oc -n ${OPENSHIFT_PROJECT} logs --insecure-skip-tls-verify --timestamps -f $POD -c $CONTAINER 2> /dev/null > /tmp/oc-build-deploy/logs/container/${DAEMONSET}/$POD-$CONTAINER.log &
      done

      # this will wait for all log streaming we started to finish
      wait
    }

    # If we are here, this means the pods have all stopped (probably because they failed), we just restart
  done
}

# start background logs streaming
stream_logs_daemonset &
STREAM_LOGS_PID=$!

DESIRED_NUMBER=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get daemonset "${DAEMONSET}" -o=go-template --template='{{.status.desiredNumberScheduled}}')
MAX_WAIT_SECONDS=600
END=$((SECONDS+$MAX_WAIT_SECONDS))

while true; do
    if [[ $SECONDS -gt $END ]]; then
      # stop all running stream logs
      pkill -P $STREAM_LOGS_PID || true

      # shows all logs we collected for the new containers
      if [ -z "$(ls -A /tmp/oc-build-deploy/logs/container/${DAEMONSET})" ]; then
        echo "Daemonset '${DAEMONSET}' was not fully scaled within $MAX_WAIT_SECONDS seconds, tried to gatter some startup logs of the containers, but unfortunately there where none created, sorry."
      else
        echo "Daemonset '${DAEMONSET}' was not fully scaled within $MAX_WAIT_SECONDS seconds, tried to gatter some startup logs of the containers, hope this helps debugging:"
        find /tmp/oc-build-deploy/logs/container/${DAEMONSET}/ -type f -print0 2>/dev/null | xargs -0 -I % sh -c 'echo ======== % =========; cat %; echo'
      fi

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

# stop all running stream logs
pkill -P $STREAM_LOGS_PID || true