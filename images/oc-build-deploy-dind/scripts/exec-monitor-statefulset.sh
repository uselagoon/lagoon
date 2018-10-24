#!/bin/bash

# while the rollout of a new statefulset is running we gatter the logs of the new generated pods and save them in a known location
# in case this rollout fails, we show the logs of the new containers to the user as they might contain information about why
# the rollout has failed
stream_logs_statefulset() {
  set +x
  # load the version of the new pods
  UPDATE_REVISION=$(oc -n ${OPENSHIFT_PROJECT} get --insecure-skip-tls-verify statefulset ${STATEFULSET} -o=go-template --template='{{.status.updateRevision}}')
  mkdir -p /tmp/oc-build-deploy/logs/container/${STATEFULSET}

  # this runs in a loop forever (until killed)
  while [ 1 ]
  do
    # Gatter all pods and their containers for the current statefulset revision and stream their logs into files
    oc -n ${OPENSHIFT_PROJECT} get --insecure-skip-tls-verify pods -l controller-revision-hash=${UPDATE_REVISION} -o json | jq -r '.items[] | .metadata.name + " " + .spec.containers[].name' | while read -r POD CONTAINER ; do
        oc -n ${OPENSHIFT_PROJECT} logs --insecure-skip-tls-verify --timestamps -f $POD -c $CONTAINER 2> /dev/null >> /tmp/oc-build-deploy/logs/container/${STATEFULSET}/$POD-$CONTAINER.log &
    done

    # this will wait for all log streaming we started to finish
    wait

    # If we are here, this means the pods have all stopped (probably because they failed), we just restart
  done
}

# start background logs streaming
stream_logs_statefulset &

REPLICAS=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get statefulset "${STATEFULSET}" -o=go-template --template='{{.spec.replicas}}')
MAX_WAIT_SECONDS=600
END=$((SECONDS+$MAX_WAIT_SECONDS))

while true; do
    if [[ $SECONDS -gt $END ]]; then
      # stop all running stream logs
      pkill -P $$
      echo "Statefulset '${STATEFULSET}' was not fully scaled within $MAX_WAIT_SECONDS seconds, tried to gatter some startup logs of the containers, hope this helps debugging:"
      find /tmp/oc-build-deploy/logs/container/${STATEFULSET}/ -type f -print0 | xargs -0 -I % sh -c 'echo ======== % =========; cat %; echo'
      exit 1
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

# stop all running stream logs
pkill -P $$
