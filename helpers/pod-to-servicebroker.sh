#!/bin/bash


function outputToYaml() {
  IFS=''
  while read data; do
    echo "$data" /tmp/out.yaml;
  done;
  oc apply -f /tmp/out.yaml
}


SERVICE_NAME=mariadb
SERVICE_TYPE=mariadb-shared
# export old mariadb
OLD_POD=$(oc get pod -o  custom-columns=NAME:.metadata.name --no-headers -l service=mariadb)
SECRETS=/tmp/${OLD_POD}-migration.yaml
# create service broker
## taken from build-deploy-docker-compose.sh

OPENSHIFT_SERVICES_TEMPLATE="$(git rev-parse --show-toplevel)/oc-build-deploy/openshift-templates/${SERVICE_TYPE}/servicebroker.yml"

OPENSHIFT_TEMPLATE=$OPENSHIFT_SERVICES_TEMPLATE
. $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/exec-openshift-resources.sh



# ServiceBrokers take a bit, wait until the credentials secret is available
until oc get --insecure-skip-tls-verify secret ${SERVICE_NAME}-servicebroker-credentials
do
  echo "Secret ${SERVICE_NAME}-servicebroker-credentials not available yet, waiting for 10 secs"
  sleep 10
done
# Load credentials out of secret
oc get --insecure-skip-tls-verify secret ${SERVICE_NAME}-servicebroker-credentials -o yaml > $SECRETS

DB_HOST=$(cat $SECRETS | shyaml get-value data.DB_HOST | base64 -d)
DB_USER=$(cat $SECRETS | shyaml get-value data.DB_USER | base64 -d)
DB_PASSWORD=$(cat $SECRETS | shyaml get-value data.DB_PASSWORD | base64 -d)
DB_NAME=$(cat $SECRETS | shyaml get-value data.DB_NAME | base64 -d)
DB_PORT=$(cat $SECRETS | shyaml get-value data.DB_PORT | base64 -d)

# Add credentials to our configmap, prefixed with the name of the servicename of this servicebroker
oc patch --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  configmap lagoon-env \
  -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_HOST\":\"${DB_HOST}\", \"${SERVICE_NAME_UPPERCASE}_USERNAME\":\"${DB_USER}\", \"${SERVICE_NAME_UPPERCASE}_PASSWORD\":\"${DB_PASSWORD}\", \"${SERVICE_NAME_UPPERCASE}_DATABASE\":\"${DB_NAME}\", \"${SERVICE_NAME_UPPERCASE}_PORT\":\"${DB_PORT}\"}}"

# transfer database between from old to new

oc exec $OLD_POD " mysqldump drupal | mysql -h $DB_HOST -u $DB_USER -p${DB_PASSWORD} -P $DB_PORT "
