#!/bin/bash

which shyaml > /dev/null
if [ $? -gt 0 ]; then
  echo "please install shyaml (pip3 install shyaml)"
  exit 1
fi

PROJECT_NAME=$(oc project -q)

SERVICE_NAME=mariadb
SERVICE_NAME_UPPERCASE=$(echo $SERVICE_NAME | tr [:lower:] [:upper:])
SERVICE_TYPE=mariadb-shared

# export old mariadb
OLD_POD=$(oc get pod -o  custom-columns=NAME:.metadata.name --no-headers -l service=$SERVICE_NAME)
echo "found $SERVICE_NAME pod $OLD_POD"

oc scale dc/nginx --replicas=0
echo "Pausing nginx"

# create service broker
## taken from build-deploy-docker-compose.sh

OPENSHIFT_TEMPLATE="$(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/openshift-templates/${SERVICE_TYPE}/servicebroker.yml"

# Only SERVICE_NAME is used in the template, fudge the other parameters.
oc process  --local -o yaml --insecure-skip-tls-verify \
  -f ${OPENSHIFT_TEMPLATE} \
  -p SERVICE_NAME="${SERVICE_NAME}" \
  -p SAFE_BRANCH="NULL" \
  -p SAFE_PROJECT="NULL" \
  -p BRANCH="NULL" \
  -p PROJECT="NULL" \
  -p LAGOON_GIT_SHA="NULL" \
  -p SERVICE_ROUTER_URL="NULL" \
  -p REGISTRY="NULL" \
  -p OPENSHIFT_PROJECT="NULL" \
| oc apply -f -

# ServiceBrokers take a bit, wait until the credentials secret is available
until oc get --insecure-skip-tls-verify secret ${SERVICE_NAME}-servicebroker-credentials
do
  echo "Secret ${SERVICE_NAME}-servicebroker-credentials not available yet, waiting for 10 secs"
  sleep 10
done

# Load credentials out of secret
SECRETS=/tmp/${PROJECT_NAME}-${OLD_POD}-migration.yaml
oc get --insecure-skip-tls-verify secret ${SERVICE_NAME}-servicebroker-credentials -o yaml > $SECRETS

DB_HOST=$(cat $SECRETS | shyaml get-value data.DB_HOST | base64 -D)
DB_USER=$(cat $SECRETS | shyaml get-value data.DB_USER | base64 -D)
DB_PASSWORD=$(cat $SECRETS | shyaml get-value data.DB_PASSWORD | base64 -D)
DB_NAME=$(cat $SECRETS | shyaml get-value data.DB_NAME | base64 -D)
DB_PORT=$(cat $SECRETS | shyaml get-value data.DB_PORT | base64 -D)

echo "*** Transfering from $OLD_POD to $DB_HOST"
# transfer database between from old to new
oc exec $OLD_POD -- bash -c "mysqldump --no-create-db drupal | mysql -h $DB_HOST -u $DB_USER -p${DB_PASSWORD} -P $DB_PORT $DB_NAME"

CONFIG_BAK="/tmp/${PROJECT_NAME}-$(date +%F-%T)-lagoon-env.yaml"
echo "*** Backing up configmap in case we need to revert: ${CONFIG_BAK}"
oc get configmap lagoon-env -o yaml > $CONFIG_BAK

echo "*** updating configmap to point to ${DB_HOST}."
# Add credentials to our configmap, prefixed with the name of the servicename of this servicebroker
oc patch --insecure-skip-tls-verify configmap lagoon-env \
   -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_HOST\":\"${DB_HOST}\", \"${SERVICE_NAME_UPPERCASE}_USERNAME\":\"${DB_USER}\", \"${SERVICE_NAME_UPPERCASE}_PASSWORD\":\"${DB_PASSWORD}\", \"${SERVICE_NAME_UPPERCASE}_DATABASE\":\"${DB_NAME}\", \"${SERVICE_NAME_UPPERCASE}_PORT\":\"${DB_PORT}\"}}"


echo "*** Scaling old mariadb to 0; you can clean up the DC and pv later"
oc scale dc/mariadb --replicas=0

# transfer complete, clean up
rm -fv $SECRETS

oc scale dc/nginx --replicas=1

oc rollout latest dc/nginx
oc rollout status dc/nginx
echo "*** done."
