#!/bin/bash

function outputToYaml() {
  IFS=''
  while read data; do
    echo "$data" >> /tmp/k8up-archive-initiate.yml;
  done;
}

if [ -z "$OPENSHIFT_PROJECT" ]; then
  echo "OPENSHIFT_PROJECT not set"
  exit 1
fi

if [ -z "$ARCHIVE_BUCKET" ]; then
  echo "ARCHIVE_BUCKET not set"
  exit 1
fi

set -e -o pipefail

OC="oc"

rm -f /tmp/k8up-archive-initiate.yml;

echo "${OPENSHIFT_PROJECT}: starting =================================================================="

# Fill environment variables which are needed by exec-openshift-resources.sh and the lagoon templates
CONFIGMAP=$($OC -n $OPENSHIFT_PROJECT get configmap lagoon-env -o json)
PROJECT=$(echo "$CONFIGMAP" | jq -r '.data.LAGOON_PROJECT')
SAFE_PROJECT=$(echo "$CONFIGMAP" | jq -r '.data.LAGOON_SAFE_PROJECT')
BRANCH=$(echo "$CONFIGMAP" | jq -r '.data.LAGOON_GIT_BRANCH')
SAFE_BRANCH=$(echo "$CONFIGMAP" | jq -r '.data.LAGOON_GIT_SAFE_BRANCH')
LAGOON_GIT_SHA="00000000000000000000000000000000000000000"
OPENSHIFT_REGISTRY="docker-registry.default.svc:5000"
ROUTER_URL=""
SERVICE_NAME="none"

# If restic backups are supported by this cluster we create the schedule definition
if oc get customresourcedefinition schedules.backup.appuio.ch > /dev/null; then

  # create archive only if there is a backup-schedule already existing for this project
  if oc -n ${OPENSHIFT_PROJECT} get schedule backup-schedule &> /dev/null; then
    TEMPLATE_PARAMETERS=()

    # Run Archive on Monday at 0300-0600
    ARCHIVE_SCHEDULE=$( $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/convert-crontab.sh "${OPENSHIFT_PROJECT}" "M H(6-12) * * 2")
    TEMPLATE_PARAMETERS+=(-p ARCHIVE_SCHEDULE="${ARCHIVE_SCHEDULE}")

    TEMPLATE_PARAMETERS+=(-p ARCHIVE_BUCKET="${ARCHIVE_BUCKET}")

    OPENSHIFT_TEMPLATE="$(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/openshift-templates/backup-archive-schedule.yml"
    .  $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/exec-openshift-resources.sh

    oc apply -n ${OPENSHIFT_PROJECT} -f /tmp/k8up-archive-initiate.yml
    rm /tmp/k8up-archive-initiate.yml
  else
    echo "${OPENSHIFT_PROJECT}: No backup-schedule found for project, not creating an archive-schedule"
  fi
else
  echo "k8up is not supported by this cluster"
  exit 1
fi

echo "${OPENSHIFT_PROJECT}: done =================================================================="
