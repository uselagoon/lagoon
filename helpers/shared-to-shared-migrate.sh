#!/usr/bin/env bash

#
# What this script is for
# =======================
# This script will migrate a database user, access, database and contents from
# an existing cluster to a destination cluster.
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
# * You have a `.my.cnf` file for the desintation database cluster.
# * If your destination database cluster is not directly accessible, then you
#   have created SSH tunnels to expose them on a local port.
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
# --destination shared-cluster.cluster-apple.ap-southeast-2.rds.amazonaws.com \
# --replica shared-cluster.cluster-r0-apple.ap-southeast-2.rds.amazonaws.com \
# --namespace NAMESPACE \
# --dry-run
#
set -euo pipefail

# Initialize our own variables:
DESTINATION_CLUSTER=""
REPLICA_CLUSTER=""
NAMESPACE=""
DRY_RUN=""
TIMESTAMP=$(date +%s)

# Colours.
shw_grey () {
  tput bold
	tput setaf 0
	echo "$@"
	tput sgr0
}
shw_norm () {
  tput bold
	tput setaf 9
	echo "$@"
	tput sgr0
}
shw_info () {
  tput bold
	tput setaf 4
	echo "$@"
	tput sgr0
}
shw_warn () {
  tput bold
	tput setaf 2
	echo "$@"
	tput sgr0
}
shw_err ()  {
  tput bold
	tput setaf 1
	echo "$@"
	tput sgr0
}

# Parse input arguments.
while [[ $# -gt 0 ]] ; do
  case $1 in
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
    *)
		echo "Invalid Argument: $1"
		exit 3
    ;;
  esac
done

shw_grey "================================================"
shw_grey " START_TIMESTAMP='$(date +%Y-%m-%dT%H:%M:%S%z)'"
shw_grey "================================================"
shw_grey " DESTINATION_CLUSTER=$DESTINATION_CLUSTER"
shw_grey " REPLICA_CLUSTER=$REPLICA_CLUSTER"
shw_grey " NAMESPACE=$NAMESPACE"
shw_grey "================================================"

for util in oc jq mysql; do
	if ! command -v ${util} > /dev/null; then
		shw_err "Please install ${util}"
		exit 1
	fi
done

CONF_FILE=${HOME}/.my.cnf-${DESTINATION_CLUSTER}
if [ ! -f "$CONF_FILE" ]; then
  shw_err "ERROR: please create $CONF_FILE so I can know how to connect to ${DESTINATION_CLUSTER}"
  exit 2
fi

if [ "$DRY_RUN" ] ; then
  shw_warn "Dry run is enabled, so no network service changes will take place."
fi

# Load the DBaaS credentials for the project
SECRETS=$(oc -n "$NAMESPACE" get secret mariadb-servicebroker-credentials -o json)

DB_NETWORK_SERVICE=$(echo "$SECRETS" | jq -er '.data.DB_HOST | @base64d')
if echo "$SECRETS" | grep -q DB_READREPLICA_HOSTS ; then
  DB_READREPLICA_HOSTS=$(echo "$SECRETS" | jq -er '.data.DB_READREPLICA_HOSTS | @base64d')
else
  DB_READREPLICA_HOSTS=""
fi
DB_USER=$(echo "$SECRETS" | jq -er '.data.DB_USER | @base64d')
DB_PASSWORD=$(echo "$SECRETS" | jq -er '.data.DB_PASSWORD | @base64d')
DB_NAME=$(echo "$SECRETS" | jq -er '.data.DB_NAME | @base64d')
DB_PORT=$(echo "$SECRETS" | jq -er '.data.DB_PORT | @base64d')

shw_grey "================================================"
shw_grey " DB_NETWORK_SERVICE=$DB_NETWORK_SERVICE"
shw_grey " DB_READREPLICA_HOSTS=$DB_READREPLICA_HOSTS"
shw_grey " DB_USER=$DB_USER"
shw_grey " DB_PASSWORD=$DB_PASSWORD"
shw_grey " DB_NAME=$DB_NAME"
shw_grey " DB_PORT=$DB_PORT"
shw_grey "================================================"

# Ensure there is a database in the destination.
shw_info "> Preparing Database, User, and permissions on destination"
shw_info "================================================"
CONF_FILE=${HOME}/.my.cnf-${DESTINATION_CLUSTER}
mysql --defaults-file="$CONF_FILE" -se "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;"
mysql --defaults-file="$CONF_FILE" -se "CREATE USER IF NOT EXISTS \`${DB_USER}\`@'%' IDENTIFIED BY '${DB_PASSWORD}';"
mysql --defaults-file="$CONF_FILE" -se "GRANT ALL ON \`${DB_NAME}\`.* TO \`${DB_USER}\`@'%';"
mysql --defaults-file="$CONF_FILE" -se "FLUSH PRIVILEGES;"

# Verify access.
shw_info "> Verify MySQL access for the new user"
shw_info "================================================"
mysql --defaults-file="$CONF_FILE" -e "SELECT * FROM mysql.db WHERE Db = '${DB_NAME}'\G;"

# Dump the database inside the CLI pod.
POD=$(oc -n "$NAMESPACE" get pods -o json --show-all=false -l service=cli | jq -er '.items[].metadata.name')
shw_info "> Dumping database $DB_NAME on pod $POD on host $DB_NETWORK_SERVICE"
shw_info "================================================"
oc -n "$NAMESPACE" exec "$POD" -- bash -c "time mysqldump -h '$DB_NETWORK_SERVICE' -u '$DB_USER' -p'$DB_PASSWORD' '$DB_NAME' > /tmp/migration.sql"
oc -n "$NAMESPACE" exec "$POD" -- ls -lath /tmp/migration.sql || exit 1
oc -n "$NAMESPACE" exec "$POD" -- head -n 5 /tmp/migration.sql
oc -n "$NAMESPACE" exec "$POD" -- tail -n 5 /tmp/migration.sql || exit 1
shw_norm "> Dump is done"
shw_norm "================================================"

# Import to new database.
shw_info "> Importing the dump into ${DESTINATION_CLUSTER}"
shw_info "================================================"
oc -n "$NAMESPACE" exec "$POD" -- bash -c "time mysql -h '$DESTINATION_CLUSTER' -u '$DB_USER' -p'$DB_PASSWORD' '$DB_NAME' < /tmp/migration.sql"
oc -n "$NAMESPACE" exec "$POD" -- rm /tmp/migration.sql

shw_norm "> Import is done"
shw_norm "================================================"

# Alter the network service(s).
shw_info "> Altering the Network Service $DB_NETWORK_SERVICE to point at $DESTINATION_CLUSTER"
shw_info "================================================"
ORIGINAL_DB_HOST=$(oc -n "$NAMESPACE" get "svc/$DB_NETWORK_SERVICE" -o json --export | tee "/tmp/$NAMESPACE-svc.json" | jq -er '.spec.externalName')
if [ "$DRY_RUN" ] ; then
  echo "**DRY RUN**"
else
  oc -n "$NAMESPACE" patch "svc/$DB_NETWORK_SERVICE" -p "{\"spec\":{\"externalName\": \"${DESTINATION_CLUSTER}\"}}"
fi
if [ "$DB_READREPLICA_HOSTS" ]; then
  shw_info "> Altering the Network Service $DB_READREPLICA_HOSTS to point at $REPLICA_CLUSTER"
  shw_info "================================================"
  ORIGINAL_DB_READREPLICA_HOSTS=$(oc -n "$NAMESPACE" get "svc/$DB_READREPLICA_HOSTS" -o json --export | tee "/tmp/$NAMESPACE-svc-replica.json" | jq -er '.spec.externalName')
  if [ "$DRY_RUN" ] ; then
    echo "**DRY RUN**"
  else
    oc -n "$NAMESPACE" patch "svc/$DB_READREPLICA_HOSTS" -p '{"spec":{"externalName": "'"$REPLICA_CLUSTER"'"}}'
  fi
fi

# Unsure what if any delay there is in this to take effect, but 1 second sounds
# completely reasonable.
sleep 1

# Verify the correct RDS cluster.
shw_info "> Output the RDS cluster that Drush is connecting to"
shw_info "================================================"
oc -n "$NAMESPACE" exec "$POD" -- bash -c "drush sqlq 'SELECT @@aurora_server_id;'"

# Drush status.
shw_info "> Drush status"
shw_info "================================================"
oc -n "$NAMESPACE" exec "$POD" -- bash -c "drush status"

# Get routes, and ensure a cache bust works.
ROUTE=$(oc -n "$NAMESPACE" get routes -o json | jq -er '.items[0].spec.host')
shw_info "> Testing the route https://${ROUTE}/?${TIMESTAMP}"
shw_info "================================================"
curl -skLIXGET "https://${ROUTE}/?${TIMESTAMP}" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36" \
  --cookie "NO_CACHE=1" | grep -E "HTTP|Cache|Location|LAGOON" || true

shw_grey "================================================"
shw_grey ""
shw_grey "In order to rollback this change, edit the Network Service(s) like so:"
shw_grey ""
shw_grey "oc -n $NAMESPACE patch svc/$DB_NETWORK_SERVICE -p '{\"spec\":{\"externalName\": \"$ORIGINAL_DB_HOST\"}}'"
if [ "$DB_READREPLICA_HOSTS" ]; then
  shw_grey "oc -n $NAMESPACE patch svc/$DB_READREPLICA_HOSTS -p '{\"spec\":{\"externalName\": \"$ORIGINAL_DB_READREPLICA_HOSTS\"}}'"
fi

echo ""
shw_grey "================================================"
shw_grey " END_TIMESTAMP='$(date +%Y-%m-%dT%H:%M:%S%z)'"
shw_grey "================================================"
shw_norm "Done"
exit 0
