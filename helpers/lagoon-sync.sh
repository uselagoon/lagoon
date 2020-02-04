#!/bin/bash

# to create serviceaccounts:
#    oc -n $namespace create serviceaccount lagoon-sync
#    oc -n $namespace adm policy add-role-to-user edit -z lagoon-sync
#    oc -n $namespace serviceaccounts get-token lagoon-sync

set -eu -o pipefail

#SOURCE_CONSOLE=""
#SOURCE_NAMESPACE=""
#SOURCE_SERVICEACCOUNT_TOKEN=""

#DESTINATION_CONSOLE=""
#DESTINATION_NAMESPACE=""
#DESTINATION_SERVICEACCOUNT_TOKEN=""

if [ -z "$SOURCE_CONSOLE" ]; then
  echo "SOURCE_CONSOLE not set"
  exit 1
fi

if [ -z "$DESTINATION_CONSOLE" ]; then
  echo "DESTINATION_CONSOLE not set"
  exit 1
fi

if [ -z "$SOURCE_SERVICEACCOUNT_TOKEN" ]; then
  echo "SOURCE_SERVICEACCOUNT_TOKEN not set"
  exit 1
fi

if [ -z "$DESTINATION_SERVICEACCOUNT_TOKEN" ]; then
  echo "DESTINATION_SERVICEACCOUNT_TOKEN not set"
  exit 1
fi

if [ -z "$SOURCE_NAMESPACE" ]; then
  echo "SOURCE_NAMESPACE not set"
  exit 1
fi

if [ -z "$DESTINATION_NAMESPACE" ]; then
  echo "DESTINATION_NAMESPACE not set"
  exit 1
fi

echo "SOURCE_CONSOLE: $SOURCE_CONSOLE"
echo "SOURCE_NAMESPACE: $SOURCE_NAMESPACE"
echo "DESTINATION_CONSOLE: $DESTINATION_CONSOLE"
echo "DESTINATION_NAMESPACE: $DESTINATION_NAMESPACE"

set -v

mkdir -p /tmp/lagoon-sync/backup

oc login $SOURCE_CONSOLE --token=$SOURCE_SERVICEACCOUNT_TOKEN
source_context=$(oc config current-context)

oc login $DESTINATION_CONSOLE --token=$DESTINATION_SERVICEACCOUNT_TOKEN
destination_context=$(oc config current-context)

source_api_db_pod=$(oc --context=$source_context -n $SOURCE_NAMESPACE get pod -o custom-columns=NAME:.metadata.name --no-headers -l service=api-db)
oc --context=$source_context -n $SOURCE_NAMESPACE exec $source_api_db_pod -- /lagoon/mysql-backup.sh 127.0.0.1 || true
source_api_db_backup=$(oc --context=$source_context -n $SOURCE_NAMESPACE exec $source_api_db_pod -- sh -c "find . -name \"*.sql.gz\" -print0 | xargs -r -0 ls -1 -t | head -1")
oc --context=$source_context -n $SOURCE_NAMESPACE exec $source_api_db_pod -- cat $source_api_db_backup > /tmp/lagoon-sync/$source_api_db_backup


destination_api_db_pod=$(oc --context=$destination_context -n $DESTINATION_NAMESPACE get pod -o custom-columns=NAME:.metadata.name --no-headers -l service=api-db)
oc --context=$destination_context -n $DESTINATION_NAMESPACE exec -i $destination_api_db_pod -- sh -c "mkdir -p backup"
oc --context=$destination_context -n $DESTINATION_NAMESPACE exec -i $destination_api_db_pod -- sh -c "cat > $source_api_db_backup" < /tmp/lagoon-sync/$source_api_db_backup
oc --context=$destination_context -n $DESTINATION_NAMESPACE exec -i $destination_api_db_pod -- sh -c "zcat $source_api_db_backup | mysql infrastructure"


source_keycloak_db_pod=$(oc --context=$source_context -n $SOURCE_NAMESPACE get pod -o custom-columns=NAME:.metadata.name --no-headers -l service=keycloak-db)
oc --context=$source_context -n $SOURCE_NAMESPACE exec $source_keycloak_db_pod -- /lagoon/mysql-backup.sh 127.0.0.1
source_keycloak_db_backup=$(oc --context=$source_context -n $SOURCE_NAMESPACE exec $source_keycloak_db_pod -- sh -c "find . -name \"*.sql.gz\" -print0 | xargs -r -0 ls -1 -t | head -1")
oc --context=$source_context -n $SOURCE_NAMESPACE exec $source_keycloak_db_pod -- cat $source_keycloak_db_backup > /tmp/lagoon-sync/$source_keycloak_db_backup

destination_keycloak_db_pod=$(oc --context=$destination_context -n $DESTINATION_NAMESPACE get pod -o custom-columns=NAME:.metadata.name --no-headers -l service=keycloak-db)
oc --context=$destination_context -n $DESTINATION_NAMESPACE exec -i $destination_keycloak_db_pod -- sh -c "mkdir -p backup"
oc --context=$destination_context -n $DESTINATION_NAMESPACE exec -i $destination_keycloak_db_pod -- sh -c "cat > $source_keycloak_db_backup" < /tmp/lagoon-sync/$source_keycloak_db_backup
oc --context=$destination_context -n $DESTINATION_NAMESPACE exec -i $destination_keycloak_db_pod -- sh -c "zcat $source_keycloak_db_backup | mysql keycloak"


oc --context=$destination_context -n $DESTINATION_NAMESPACE rollout latest dc/keycloak
oc --context=$destination_context -n $DESTINATION_NAMESPACE rollout latest dc/api

oc --context=$destination_context -n $DESTINATION_NAMESPACE exec -i $destination_api_db_pod -- /rerun_initdb.sh


