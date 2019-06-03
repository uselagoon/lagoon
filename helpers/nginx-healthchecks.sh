#!/bin/bash

if [ -z "$OPENSHIFT_PROJECT" ]; then
  echo "OPENSHIFT_PROJECT not set"
  exit 1
fi

set -eu -o pipefail

OC="oc"

echo "${OPENSHIFT_PROJECT}: starting =================================================================="

# Remove any backupcommand from nginx pods if they exit
if oc -n ${OPENSHIFT_PROJECT} get deploymentconfig nginx -o json &> /dev/null; then
  oc -n ${OPENSHIFT_PROJECT} patch dc/nginx --patch '{"spec":{"template":{"spec":{"containers":[{"name":"php","livenessProbe":{"$patch":"replace","tcpSocket":{"port":9000},"initialDelaySeconds":60,"periodSeconds":10},"readinessProbe":{"$patch":"replace","tcpSocket":{"port":9000},"initialDelaySeconds":2,"periodSeconds":10}}]}}}}' || true
  oc -n ${OPENSHIFT_PROJECT} rollout status --watch dc/nginx
fi


echo "${OPENSHIFT_PROJECT}: done =================================================================="
