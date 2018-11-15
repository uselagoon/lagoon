#!/bin/bash

# while the rollout of a new deployment is running we gatter the logs of the new generated pods and save them in a known location
# in case this rollout fails, we show the logs of the new containers to the user as they might contain information about why
# the rollout has failed
stream_logs_deployment() {
  set +x
  # load the version of the new pods
  LATEST_VERSION=$(oc -n ${OPENSHIFT_PROJECT} get --insecure-skip-tls-verify dc/${SERVICE_NAME} -o=go-template --template='{{.status.latestVersion}}')
  mkdir -p /tmp/oc-build-deploy/logs/container/${SERVICE_NAME}

  # this runs in a loop forever (until killed)
  while [ 1 ]
  do
    # Gatter all pods and their containers for the current rollout and stream their logs into files
    oc -n ${OPENSHIFT_PROJECT} get --insecure-skip-tls-verify pods -l deployment=${SERVICE_NAME}-${LATEST_VERSION} -o json | jq -r '.items[] | .metadata.name + " " + .spec.containers[].name' |
    {
      while read -r POD CONTAINER ; do
          oc -n ${OPENSHIFT_PROJECT} logs --insecure-skip-tls-verify --timestamps -f $POD -c $CONTAINER $SINCE_TIME 2> /dev/null > /tmp/oc-build-deploy/logs/container/${SERVICE_NAME}/$POD-$CONTAINER.log &
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
oc rollout --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} status ${SERVICE_ROLLOUT_TYPE} ${SERVICE_NAME} --watch || ret=$?

if [[ $ret -ne 0 ]]; then
  # stop all running stream logs
  pkill -P $STREAM_LOGS_PID || true

  # shows all logs we collected for the new containers
  if [ -z "$(ls -A /tmp/oc-build-deploy/logs/container/${SERVICE_NAME})" ]; then
    echo "Rollout for ${SERVICE_NAME} failed, tried to gatter some startup logs of the containers, but unfortunately there where none created, sorry."
  else
    echo "Rollout for ${SERVICE_NAME} failed, tried to gatter some startup logs of the containers, hope this helps debugging:"
    find /tmp/oc-build-deploy/logs/container/${SERVICE_NAME}/ -type f -print0 2>/dev/null | xargs -0 -I % sh -c 'echo ======== % =========; cat %; echo'
  fi

  exit 1
fi

# stop all running stream logs
pkill -P $STREAM_LOGS_PID || true
