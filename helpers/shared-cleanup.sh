#!/usr/bin/env bash

# this script will assumed you're logged into an openshift cluster locally.
# and that you can connect directly to the database servers listed in DB_HOST
# on port 3306 with a .my.cnf that allows you to run
# non-interactive mysql commands.

# use oc -n openshift-ansible-service-broker get secret/lagoon-dbaas-db-credentials
# if the database is not directly connectable, an ssh tunnel can be used:
# ~/.my.cnf-mysql-development-cluster.cluster-xxx.rds.amazonaws.com
# [client]
# host=127.0.0.1
# port=33007
# user=root
# password=af105380aa4a2f034a083daeb9ed27b7a8395a44

# ssh -L 33007:mysql-development-cluster.cluster-xxx.rds.amazonaws.com:3306 infra1.cluster1.amazee.io

# after running this script, the user will be presented with a list of
# databases that are probably ok to remove.

set -euo pipefail

for util in oc jq mysql; do
	if ! command -v ${util} > /dev/null; then
		echo "please install ${util}"
		exit 1
	fi
done

# services with a port are not servicebrokers.
echo "getting a list of services for cluster $(oc whoami --show-server)..."
oc get service --all-namespaces -o=jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{.spec.externalName}{"\n"}{end}' | awk '$2 ~ /^mariadb-/ { print }' > mariadb-services

# get a list of database servers
# ignore the dedicated servers
SERVERS=$(awk '{print $3}' mariadb-services | sort -u | grep -v "^dedicated")

for SERVER in $SERVERS; do
  CONFFILE=${HOME}/.my.cnf-${SERVER}
  if [ -f "$CONFFILE" ]; then
    echo "getting database list for server ${SERVER}..."
    mysql --defaults-file="$CONFFILE" -se 'show databases;' | grep -Ev "mysql$|_schema$" > "${SERVER}-databases"
  else
    echo "ERROR: please create $CONFFILE so I can know how to connect to $SERVER"
    exit 2
  fi
done

errors=()
for PROJECT in $(awk '$3 ~ /^dedicated/ {next} {print $1}' mariadb-services); do
  echo "checking project $PROJECT"
  DBHOST=$(grep "^${PROJECT}\s" mariadb-services | awk '{print $3}')
  DATABASE=$(oc -n "$PROJECT" get configmap lagoon-env -o json | jq -r '.data | with_entries(select(.key|match("_DATABASE";"i")))[]' || :)

  if [ -z "$DATABASE" ]; then
    echo "some problem with $PROJECT"
    errors+=("$PROJECT")
  else
    echo "found database $DATABASE on host $DBHOST"
    sed -i.bak -e "/${DATABASE}/d" "${DBHOST}-databases"
  fi
done

echo; echo 
echo These projects could not adaquately checked:
printf "%s\\n" "${errors[@]}"
echo


for SERVER in $SERVERS; do
  echo "Orphaned databases for: ${SERVER}..."
  cat "${SERVER}-databases"
  echo
done
