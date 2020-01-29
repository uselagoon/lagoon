#!/usr/bin/env bash

#
# What this script is for
# =======================
# This script will migrate a database user, access, database and contents from
# a source cluster to a destination cluster.
#
# At the moment, this is geared towards the Ansible Service Broker, but likely
# can be modified in the future to work with the DBaaS operator.
#
# It has been used successfully to migrate databases between RDS clusters.
#
# There are a whole bunch of checks after the migration to check to ensure the
# migration was a success. Likely you should do additional testing as well.
#
# Requirements
# ============
# * You are logged into OpenShift CLI and have access to the NAMESPACE you want
#   to migrate.
# * You have a `.my.cnf` file for the source and desintation database clusters.
# * If your database clusters are not directly accessible, then you have
#   created SSH tunnels to expose them on a local port.
#
# How to get your existing ASB root credentials
# =============================================
# oc -n openshift-ansible-service-broker get secret/lagoon-dbaas-db-credentials -o JSON | jq '.data'
#
# How to create a `.my.cnf` file
# ==============================
# ~/.my.cnf-shared-cluster.cluster-banana.ap-southeast-2.rds.amazonaws.com
# [client]
# host=127.0.0.1
# port=33007
# user=root
# password=banana2
#
# How to create an SSH tunnel through a jump box to your database cluster
# =======================================================================
# ssh -L 33007:shared-cluster.cluster-banana.ap-southeast-2.rds.amazonaws.com:3306 jumpbox.aws.amazee.io
#
# Example commands
# ================
# ./helpers/shared-to-shared-migrate.sh \
# --source shared-cluster.cluster-banana.ap-southeast-2.rds.amazonaws.com \
# --destination shared-cluster.cluster-apple.ap-southeast-2.rds.amazonaws.com \
# --replica shared-cluster.cluster-r0-apple.ap-southeast-2.rds.amazonaws.com \
# --namespace NAMESPACE \
# --dry-run
#
set -euo pipefail

# Reset in case getopts has been used previously in the shell.
OPTIND=1

# Initialize our own variables:
SOURCE_CLUSTER=""
DESTINATION_CLUSTER=""
REPLICA_CLUSTER=""
NAMESPACE=""
DRY_RUN=""
TIMESTAMP=$(date +%s)

while [[ $# -gt 0 ]] ; do
  key="$1"

  case $key in
    -s|--source)
    SOURCE_CLUSTER="$2"
    shift # past argument
    shift # past value
    ;;
    -d|--destination)
    DESTINATION_CLUSTER="$2"
    shift # past argument
    shift # past value
    ;;
    -r|--replica)
    REPLICA_CLUSTER="$2"
    shift # past argument
    shift # past value
    ;;
    -n|--namespace)
    NAMESPACE="$2"
    shift # past argument
    shift # past value
    ;;
    --dry-run)
    DRY_RUN="TRUE"
    shift # past argument
    ;;
  esac
done

echo "================================================"
echo " SOURCE_CLUSTER=$SOURCE_CLUSTER"
echo " DESTINATION_CLUSTER=$DESTINATION_CLUSTER"
echo " REPLICA_CLUSTER=$REPLICA_CLUSTER"
echo " NAMESPACE=$NAMESPACE"
echo "================================================"

for util in oc jq mysql shyaml; do
	if ! command -v ${util} > /dev/null; then
		echo "Please install ${util}"
		exit 1
	fi
done

CONF_FILE=${HOME}/.my.cnf-${SOURCE_CLUSTER}
if [ ! -f "$CONF_FILE" ]; then
  echo "ERROR: please create $CONF_FILE so I can know how to connect to ${SOURCE_CLUSTER}"
  exit 2
fi

CONF_FILE=${HOME}/.my.cnf-${DESTINATION_CLUSTER}
if [ ! -f "$CONF_FILE" ]; then
  echo "ERROR: please create $CONF_FILE so I can know how to connect to ${DESTINATION_CLUSTER}"
  exit 2
fi

if [ ! -z "${DRY_RUN}" ] ; then
  echo "Dry run is enabled, so no network service changes will take place."
fi

# Load the DBaaS credentials for the project
SECRETS=/tmp/${NAMESPACE}-migration.yaml
oc -n ${NAMESPACE} get secret mariadb-servicebroker-credentials -o yaml > $SECRETS

DB_NETWORK_SERVICE=$(cat $SECRETS | shyaml get-value data.DB_HOST | base64 -D)
if cat ${SECRETS} | grep DB_READREPLICA_HOSTS > /dev/null ; then
  DB_READREPLICA_HOSTS=$(cat $SECRETS | shyaml get-value data.DB_READREPLICA_HOSTS | base64 -D)
else
  DB_READREPLICA_HOSTS=""
fi
DB_USER=$(cat $SECRETS | shyaml get-value data.DB_USER | base64 -D)
DB_PASSWORD=$(cat $SECRETS | shyaml get-value data.DB_PASSWORD | base64 -D)
DB_NAME=$(cat $SECRETS | shyaml get-value data.DB_NAME | base64 -D)
DB_PORT=$(cat $SECRETS | shyaml get-value data.DB_PORT | base64 -D)

echo "================================================"
echo " DB_NETWORK_SERVICE=$DB_NETWORK_SERVICE"
echo " DB_READREPLICA_HOSTS=$DB_READREPLICA_HOSTS"
echo " DB_USER=$DB_USER"
echo " DB_PASSWORD=$DB_PASSWORD"
echo " DB_NAME=$DB_NAME"
echo "================================================"

# Ensure there is a database in the destination.
echo "> Setting up the MySQL bits"
echo "================================================"
CONF_FILE=${HOME}/.my.cnf-${DESTINATION_CLUSTER}
mysql --defaults-file="$CONF_FILE" -se "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;"
mysql --defaults-file="$CONF_FILE" -se "CREATE USER IF NOT EXISTS \`${DB_USER}\`@'%' IDENTIFIED BY '${DB_PASSWORD}';"
mysql --defaults-file="$CONF_FILE" -se "GRANT ALL ON \`${DB_NAME}\`.* TO \`${DB_USER}\`@'%';"
mysql --defaults-file="$CONF_FILE" -se "FLUSH PRIVILEGES;"

# Verify access.
echo "> Verify MySQL access for the new user"
echo "================================================"
mysql --defaults-file="$CONF_FILE" -e "SELECT * FROM mysql.db WHERE Db = '${DB_NAME}'\G;"

# Dump the database inside the CLI pod.
POD=$(oc -n ${NAMESPACE} get pods -o json --show-all=false -l service=cli | jq -r '.items[].metadata.name')
echo "> Dumping database ${DB_NAME} on pod ${POD} on host ${DB_NETWORK_SERVICE}"
echo "================================================"
oc -n ${NAMESPACE} exec ${POD} -- bash -c "time mysqldump -h ${DB_NETWORK_SERVICE} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > /tmp/migration.sql"
oc -n ${NAMESPACE} exec ${POD} -- ls -lath /tmp/migration.sql || exit 1
oc -n ${NAMESPACE} exec ${POD} -- head -n 5 /tmp/migration.sql
oc -n ${NAMESPACE} exec ${POD} -- tail -n 5 /tmp/migration.sql || exit 1
echo "> Dump is done"
echo "================================================"

# Import to new database.
echo "> Importing the dump into ${DESTINATION_CLUSTER}"
echo "================================================"
oc -n ${NAMESPACE} exec ${POD} -- bash -c "time mysql -h ${DESTINATION_CLUSTER} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < /tmp/migration.sql"
oc -n ${NAMESPACE} exec ${POD} -- bash -c "rm /tmp/migration.sql"

echo "> Import is done"
echo "================================================"

# Alter the network service(s).
echo "> Altering the Network Service ${DB_NETWORK_SERVICE} to point at ${DESTINATION_CLUSTER}"
echo "================================================"
oc -n ${NAMESPACE} get svc/${DB_NETWORK_SERVICE} -o yaml > /tmp/${NAMESPACE}-svc.yaml
if [ -z "${DRY_RUN}" ] ; then
  oc -n ${NAMESPACE} patch svc/${DB_NETWORK_SERVICE} -p "{\"spec\":{\"externalName\": \"${DESTINATION_CLUSTER}\"}}"
else
  echo "**DRY RUN**"
fi
if [ ! -z "${DB_READREPLICA_HOSTS}" ]; then
  echo "> Altering the Network Service ${DB_READREPLICA_HOSTS} to point at ${REPLICA_CLUSTER}"
  echo "================================================"
  oc -n ${NAMESPACE} get svc/${DB_READREPLICA_HOSTS} -o yaml > /tmp/${NAMESPACE}-svc-replica.yaml
  ORIGINAL_DB_READREPLICA_HOSTS=$(cat /tmp/${NAMESPACE}-svc-replica.yaml | shyaml get-value spec.externalName)
  if [ -z "${DRY_RUN}" ] ; then
    oc -n ${NAMESPACE} patch svc/${DB_READREPLICA_HOSTS} -p "{\"spec\":{\"externalName\": \"${REPLICA_CLUSTER}\"}}"
  else
    echo "**DRY RUN**"
  fi
fi

# Unsure what if any delay there is in this to take effect, but 1 second sounds
# completely reasonable.
sleep 1

# Verify the correct RDS cluster.
echo "> Output the RDS cluster that Drush is connecting to"
echo "================================================"
oc -n ${NAMESPACE} exec ${POD} -- bash -c "drush sqlq 'SELECT @@aurora_server_id;'"

# Drush status.
echo "> Drush status"
echo "================================================"
oc -n ${NAMESPACE} exec ${POD} -- bash -c "drush status"

# Get routes, and ensure a cache bust works.
ROUTE=$(oc -n ${NAMESPACE} get routes -o json | jq --raw-output '.items[0].spec.host')
echo "> Testing the route http://${ROUTE}/?${TIMESTAMP}"
echo "================================================"
curl -skLIXGET "http://${ROUTE}/?${TIMESTAMP}" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36" \
  --cookie "NO_CACHE=1" || TRUE

echo "================================================"
echo ""
echo "In order to rollback this change, edit the Network Service(s) like so:"
echo ""
echo "oc -n ${NAMESPACE} patch svc/${DB_NETWORK_SERVICE} -p \"{\\\"spec\\\":{\\\"externalName': \\\"${SOURCE_CLUSTER}\\\"}}\""
if [ ! -z "${DB_READREPLICA_HOSTS}" ]; then
  echo "oc -n ${NAMESPACE} patch svc/${DB_READREPLICA_HOSTS} -p \"{\\\"spec\\\":{\\\"externalName': \\\"${ORIGINAL_DB_READREPLICA_HOSTS}\\\"}}\""
fi

echo ""
echo "Done"
exit 0
