#!/bin/bash

# while the rollout of a new deployment is running we gather the logs of the new generated pods and save them in a known location
# in case this rollout fails, we show the logs of the new containers to the user as they might contain information about why
# the rollout has failed
stream_logs_deployment() {
  set +x
  # load the version of the new pods
  LATEST_POD_TEMPLATE_HASH=$(kubectl get replicaset -l app.kubernetes.io/instance=${SERVICE_NAME} --sort-by=.metadata.creationTimestamp -o=json | jq -r '.items[-1].metadata.labels."pod-template-hash"')
  mkdir -p /tmp/kubectl-build-deploy/logs/container/${SERVICE_NAME}

  # this runs in a loop forever (until killed)
  while [ 1 ]
  do
    # Gather all pods and their containers for the current rollout and stream their logs into files
    kubectl -n ${NAMESPACE} get pods -l pod-template-hash=${LATEST_POD_TEMPLATE_HASH} -o json | jq -r '.items[] | .metadata.name + " " + .spec.containers[].name' |
    {
      while read -r POD CONTAINER ; do
          kubectl -n ${NAMESPACE} logs --timestamps -f $POD -c $CONTAINER $SINCE_TIME 2> /dev/null > /tmp/kubectl-build-deploy/logs/container/${SERVICE_NAME}/$POD-$CONTAINER.log &
      done

      # this will wait for all log streaming we started to finish
      wait
    }

    # If we are here, this means the pods have all stopped (probably because they failed), we just restart
  done
}

# start background logs streaming
stream_logs_deployment &
STREAM_LOGS_PID=$!

ret=0
# default progressDeadlineSeconds is 600, doubling that here for a timeout on the status check for 1200s (20m) as a fallback for exceeding the progressdeadline
# when there may be another issue with the rollout failing, the progresdeadline doesn't always work
# (eg, existing pod in previous replicaset fails to terminate properly)
kubectl rollout -n ${NAMESPACE} status deployment ${SERVICE_NAME} --watch --timeout=1200s || ret=$?

if [[ $ret -ne 0 ]]; then
  # stop all running stream logs
  pkill -P $STREAM_LOGS_PID || true

  # shows all logs we collected for the new containers
  if [ -z "$(ls -A /tmp/kubectl-build-deploy/logs/container/${SERVICE_NAME})" ]; then
    echo "Rollout for ${SERVICE_NAME} failed, tried to gather some startup logs of the containers, but unfortunately there were none created, sorry."
  else
    echo "Rollout for ${SERVICE_NAME} failed, tried to gather some startup logs of the containers, hope this helps debugging:"
    find /tmp/kubectl-build-deploy/logs/container/${SERVICE_NAME}/ -type f -print0 2>/dev/null | xargs -0 -I % sh -c 'echo ======== % =========; cat %; echo'
  fi
  # dump the pods of this service and the status/condition message from kubernetes into a table for debugging
  # Example:
  #
  # POD/SERVICE NAME	STATUS	CONDITION	MESSAGE
  # solr-abcd12345-abcde	Pending	PodScheduled	0/3 nodes are available: 3 Too many pods.
  #
  echo "If there is any additional information about the status of pods, it will be available here"
  kubectl -n ${NAMESPACE} get pods -l lagoon.sh/service=${SERVICE_NAME} -o json | \
    jq -r '["POD/SERVICE NAME","STATUS","CONDITION","MESSAGE"], (.items[] | . as $pod | .status.conditions[] | [ $pod.metadata.name, $pod.status.phase, .type, .message]) | @tsv'

  exit 1
fi

# stop all running stream logs
pkill -P $STREAM_LOGS_PID || true
