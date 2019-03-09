#!/bin/bash

function outputToYaml() {
  IFS=''
  while read data; do
    echo "$data" >> /tmp/k8up-initiate.yml;
  done;
}

if [ -z "$JWTSECRET" ]; then
  echo "JWTSECRET not set"
  exit 1
fi

if [ -z "$OPENSHIFT_PROJECT" ]; then
  echo "OPENSHIFT_PROJECT not set"
  exit 1
fi

set -eu -o pipefail

OC="oc"

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

PROJECT_SECRET=$(echo -n "$PROJECT-$JWTSECRET" | sha256sum | cut -d " " -f 1)

# If restic backups are supported by this cluster we create the schedule definition
if oc get customresourcedefinition schedules.backup.appuio.ch > /dev/null; then

  baas_repo_pw=$(oc -n ${OPENSHIFT_PROJECT} create secret generic baas-repo-pw --from-literal=repo-pw=$(echo -n "$PROJECT_SECRET-BAAS-REPO-PW" | sha256sum | cut -d " " -f 1) -o json --dry-run)

  if ! oc -n ${OPENSHIFT_PROJECT} get secret baas-repo-pw &> /dev/null; then
    # Create baas-repo-pw secret based on the project secret
    echo "$baas_repo_pw" | oc -n ${OPENSHIFT_PROJECT} create -f -
  else
    echo "$baas_repo_pw" | oc -n ${OPENSHIFT_PROJECT} replace -f -
  fi

  TEMPLATE_PARAMETERS=()

  # Run Backups every day at 2200-0200
  BACKUP_SCHEDULE=$( $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/convert-crontab.sh "${OPENSHIFT_PROJECT}" "M H(22-2) * * *")
  TEMPLATE_PARAMETERS+=(-p BACKUP_SCHEDULE="${BACKUP_SCHEDULE}")

  # Run Checks on Sunday at 0300-0600
  CHECK_SCHEDULE=$( $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/convert-crontab.sh "${OPENSHIFT_PROJECT}" "M H(3-6) * * 0")
  TEMPLATE_PARAMETERS+=(-p CHECK_SCHEDULE="${CHECK_SCHEDULE}")

  # Run Prune on Saturday at 0300-0600
  PRUNE_SCHEDULE=$( $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/convert-crontab.sh "${OPENSHIFT_PROJECT}" "M H(3-6) * * 6")
  TEMPLATE_PARAMETERS+=(-p PRUNE_SCHEDULE="${PRUNE_SCHEDULE}")

  OPENSHIFT_TEMPLATE="$(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/openshift-templates/backup/schedule.yml"
  .  $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/exec-openshift-resources.sh

  oc apply -n ${OPENSHIFT_PROJECT} -f /tmp/k8up-initiate.yml
  rm /tmp/k8up-initiate.yml
else
  echo "k8sup is not supported by this cluster"
  exit 1
fi

# Disable backup of solr pvc's
if solr=$(oc -n ${OPENSHIFT_PROJECT} get pvc solr -o json 2> /dev/null) && [[ $(echo "$solr" | jq -r '.metadata.annotations."appuio.ch/backup"') != "false" ]]; then
  oc -n ${OPENSHIFT_PROJECT} annotate --overwrite pvc solr appuio.ch/backup="false";
fi

# Enable backup of nginx pvc's
if nginx=$(oc -n ${OPENSHIFT_PROJECT} get pvc nginx -o json 2> /dev/null) && [[ $(echo "$nginx" | jq -r '.metadata.annotations."appuio.ch/backup"') != "true" ]]; then
  oc -n ${OPENSHIFT_PROJECT} annotate --overwrite pvc nginx appuio.ch/backup="true";
fi

# Remove any backupcommand from nginx pods if they exit
if oc -n ${OPENSHIFT_PROJECT} get deploymentconfig nginx -o json 2> /dev/null | jq -r -e '.spec.template.metadata.annotations."appuio.ch/backupcommand"' &> /dev/null; then
  oc -n ${OPENSHIFT_PROJECT} patch deploymentconfig nginx --type json -p='[{"op": "remove", "path": "/spec/template/metadata/annotations/appuio.ch~1backupcommand"}]'
fi

# add backupcommand to clis to backup mariadb
if oc -n ${OPENSHIFT_PROJECT} get deploymentconfig cli &> /dev/null; then
  oc -n ${OPENSHIFT_PROJECT} patch deploymentconfig cli -p '{"spec":{"template":{"metadata":{"annotations":{"appuio.ch/backupcommand":"/bin/sh -c \"if [[ $MARIADB_HOST ]]; then dump=$(mktemp) && mysqldump --max-allowed-packet=500M --events --routines --quick --add-locks --no-autocommit --single-transaction --no-create-db -h $MARIADB_HOST -u $MARIADB_USERNAME -p$MARIADB_PASSWORD $MARIADB_DATABASE > $dump && cat $dump && rm $dump; fi\"", "backup.appuio.ch/file-extension": ".mysql.sql"}}}}}' || true
fi

echo "${OPENSHIFT_PROJECT}: done =================================================================="
