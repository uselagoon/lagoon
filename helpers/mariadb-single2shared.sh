#!/bin/bash



if [ ! "$1" ]; then
  echo "please define openshift project as first argument"
  exit 1;
fi

set -uo pipefail

which shyaml > /dev/null
if [ $? -gt 0 ]; then
  echo "please install shyaml (pip3 install shyaml)"
  exit 1
fi

which jq > /dev/null
if [ $? -gt 0 ]; then
  echo "please install jq"
  exit 1
fi

which svcat > /dev/null
if [ $? -gt 0 ]; then
  echo "please install svcat"
  exit 1
fi

set -e

PROJECT_NAME=$1

echo "*** Starting mariadb-single --> mariadb-shared migration in ${PROJECT_NAME}"

SERVICE_NAME=mariadb
SERVICE_NAME_UPPERCASE=$(echo $SERVICE_NAME | tr [:lower:] [:upper:])
SERVICE_TYPE=mariadb-shared

ENVIRONMENT_TYPE=$(oc -n $1 get configmap lagoon-env -o json | jq -r '.data.LAGOON_ENVIRONMENT_TYPE')

MARIADB_REPLICAS=$(oc -n $1 get dc/mariadb -o json | jq -r '.spec.replicas')

if [ "$MARIADB_REPLICAS" == "0" ]; then
  oc -n $1 scale dc/mariadb --replicas=1
  oc -n $1 rollout status dc/mariadb
fi

# export old mariadb pod name
OLD_POD=$(oc -n $1 get pod -o  custom-columns=NAME:.metadata.name --no-headers -l service=$SERVICE_NAME)

if [[ "$OLD_POD" ]]; then
  echo "found $SERVICE_NAME pod $OLD_POD"
else
  echo "no running pod found for service '${SERVICE_NAME}'', is it running?"
  exit 1
fi

echo "*** Pausing nginx and cli"
NGINX_REPLICAS=$(oc -n $1 get dc/nginx -o json | jq -r '.spec.replicas')
CLI_REPLICAS=$(oc -n $1 get dc/cli -o json | jq -r '.spec.replicas')
oc -n $1 scale dc/nginx --replicas=0
oc -n $1 scale dc/cli --replicas=0


# create service broker
## taken from build-deploy-docker-compose.sh

OPENSHIFT_TEMPLATE="$(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/openshift-templates/${SERVICE_TYPE}/servicebroker.yml"
SERVICEBROKER_CLASS="lagoon-dbaas-mariadb-apb"
SERVICEBROKER_PLAN="${ENVIRONMENT_TYPE}"
OPENSHIFT_PROJECT=$1
. $(git rev-parse --show-toplevel)/images/oc-build-deploy-dind/scripts/exec-openshift-create-servicebroker.sh

# ServiceBrokers take a bit, wait until the credentials secret is available
until oc -n $1 get --insecure-skip-tls-verify secret ${SERVICE_NAME}-servicebroker-credentials
do
  echo "Secret ${SERVICE_NAME}-servicebroker-credentials not available yet, waiting for 10 secs"
  sleep 10
done

# Load credentials out of secret
SECRETS=/tmp/${PROJECT_NAME}-${OLD_POD}-migration.yaml
oc -n $1 get --insecure-skip-tls-verify secret ${SERVICE_NAME}-servicebroker-credentials -o yaml > $SECRETS

DB_HOST=$(cat $SECRETS | shyaml get-value data.DB_HOST | base64 -D)
DB_USER=$(cat $SECRETS | shyaml get-value data.DB_USER | base64 -D)
DB_PASSWORD=$(cat $SECRETS | shyaml get-value data.DB_PASSWORD | base64 -D)
DB_NAME=$(cat $SECRETS | shyaml get-value data.DB_NAME | base64 -D)
DB_PORT=$(cat $SECRETS | shyaml get-value data.DB_PORT | base64 -D)

echo "*** Transfering 'drupal' database from $OLD_POD to $DB_HOST"
# transfer database between from old to new
oc -n $1 exec $OLD_POD -- bash -eo pipefail -c "mysqldump --max-allowed-packet=500M --events --routines --quick --add-locks --no-autocommit --single-transaction --no-create-db drupal | mysql -h $DB_HOST -u $DB_USER -p${DB_PASSWORD} -P $DB_PORT $DB_NAME"

CONFIG_BAK="/tmp/${PROJECT_NAME}-$(date +%F-%T)-lagoon-env.yaml"
echo "*** Backing up configmap in case we need to revert: ${CONFIG_BAK}"
oc -n $1 get configmap lagoon-env -o yaml > $CONFIG_BAK

echo "*** updating configmap to point to ${DB_HOST}."
# Add credentials to our configmap, prefixed with the name of the servicename of this servicebroker
oc -n $1 patch --insecure-skip-tls-verify configmap lagoon-env \
   -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_HOST\":\"${DB_HOST}\", \"${SERVICE_NAME_UPPERCASE}_USERNAME\":\"${DB_USER}\", \"${SERVICE_NAME_UPPERCASE}_PASSWORD\":\"${DB_PASSWORD}\", \"${SERVICE_NAME_UPPERCASE}_DATABASE\":\"${DB_NAME}\", \"${SERVICE_NAME_UPPERCASE}_PORT\":\"${DB_PORT}\"}}"


echo "*** Deleting mariadb service. Scaling old mariadb to 0; you can clean up the DC and pv later"
oc -n $1 delete service mariadb
oc -n $1 scale dc/mariadb --replicas=0

# transfer complete, clean up
rm -f $SECRETS

oc -n $1 scale dc/nginx --replicas=$NGINX_REPLICAS
oc -n $1 scale dc/cli --replicas=$CLI_REPLICAS

oc -n $1 rollout latest dc/nginx
oc -n $1 rollout latest dc/cli
oc -n $1 rollout status dc/nginx
oc -n $1 rollout status dc/cli
echo "*** done."
