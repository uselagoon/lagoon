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

# Colours.
shw_grey () {
  echo $(tput bold)$(tput setaf 0) $@ $(tput sgr 0)
}
shw_norm () {
  echo $(tput bold)$(tput setaf 9) $@ $(tput sgr 0)
}
shw_info () {
  echo $(tput bold)$(tput setaf 4) $@ $(tput sgr 0)
}
shw_warn () {
  echo $(tput bold)$(tput setaf 2) $@ $(tput sgr 0)
}
shw_err ()  {
  echo $(tput bold)$(tput setaf 1) $@ $(tput sgr 0)
}

# Services with a port are not servicebrokers.
shw_grey "Getting a list of services for cluster $(oc whoami --show-server)."
oc get service --all-namespaces -o=jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{.spec.externalName}{"\n"}{end}' \
 | awk '$2 ~ /^mariadb-/ {print}' > /tmp/mariadb-services
# Remove read replica services.
sed -i.bak '/mariadb-readreplica-/d' /tmp/mariadb-services
# Remove random database pods.
sed -i.bak '/mariadb-d7[[:space:]]*$/d' /tmp/mariadb-services

# Get a list of database clusters:
# - Ignore the dedicated clusters.
# - Ignore the read replicas.
SERVERS=$(awk '{print $3}' /tmp/mariadb-services | sort -u | grep -v "^dedicated" | grep -v ".cluster-ro-")

# Ensure you can connect to all database clusters, once you do that, list every
# database that you can that belongs to the Ansible Service Broker.
for SERVER in $SERVERS; do
  CONFFILE="${HOME}/.my.cnf-${SERVER}"
  if [ -f "$CONFFILE" ]; then
    shw_info "Getting current database list for cluster ${SERVER}..."
    # The ASB will never create a database smaller than 5 characters.
    mysql --defaults-file="$CONFFILE" -se 'show databases;' | grep -Ev "mysql$|_schema$" | grep -E '^.{5,}$' > "/tmp/${SERVER}-databases"
  else
    shw_err "ERROR: please create $CONFFILE so I can know how to connect to $SERVER"
    exit 2
  fi
done

# For every active project, find out it's database name, and remove this the
# database cluster file (to indicate it has been found).
ERRORS=()
for PROJECT in $(awk '$3 ~ /^dedicated/ {next} {print $1}' /tmp/mariadb-services); do
  shw_info "Checking namespace '${PROJECT}'."

  # In the case that there are multiple ASB configs for the 1 project, this will
  # return an array with each database in it.
  DATABASES=($(oc -n "${PROJECT}" get configmap lagoon-env -o json | jq -r '.data | with_entries(select(.key|match("_DATABASE";"i")))[]' || :))

  if [ ${#DATABASES[@]} -eq 0 ]; then
    shw_err " > Some problem with ${PROJECT}"
    ERRORS+=("${PROJECT}")
  else
    # Iterate over the potential many database names.
    for (( i=0; i<${#DATABASES[@]}; i++ )) ; do
      # @TODO it would be technically possible to have the 2 databases spread
      # across multiple database clusters, this code assumes a single project
      # uses a single database cluster.
      DBHOST=$(grep --max-count=1 "^${PROJECT}[[:space:]]" /tmp/mariadb-services | awk '{print $3}')
      shw_warn " > Found database '${DATABASES[$i]}' on host '${DBHOST}'."
      sed -i.bak -e "/${DATABASES[$i]}/d" "/tmp/${DBHOST}-databases"
    done
  fi
done

echo; echo
if [ ${#ERRORS[@]} -gt 0 ]; then
  shw_info "These projects could not adaquately checked:"
  printf "%s\\n" "${ERRORS[@]}"
  echo
fi

for SERVER in $SERVERS; do
  CONFFILE="${HOME}/.my.cnf-${SERVER}"
  echo
  shw_info "Orphaned databases for '${SERVER}'"

  # List servcer uptime.
  shw_grey "MySQL uptime (last_update can only ever be this old)"
  mysql --defaults-file="${CONFFILE}" -e "SELECT TIME_FORMAT(SEC_TO_TIME(VARIABLE_VALUE ),'%Hh %im') as Uptime from performance_schema.global_status where VARIABLE_NAME='Uptime';"

  rm -f /tmp/${SERVER}-databases-drop
  while IFS= read -r line || [[ -n "$line" ]]; do
    shw_info " $line"
    echo -n " - Last updated: "
    mysql --defaults-file="${CONFFILE}" -se "SELECT from_unixtime(UNIX_TIMESTAMP(MAX(UPDATE_TIME))) as last_update FROM information_schema.tables WHERE TABLE_SCHEMA IN ('$line');"
    echo -n " - Table count: "
    mysql --defaults-file="${CONFFILE}" -se "SELECT COUNT(1) AS TableCount FROM information_schema.tables WHERE table_schema = '$line';"
    echo "DROP DATABASE \`$line\`;" >>  /tmp/${SERVER}-databases-drop
  done < "/tmp/${SERVER}-databases"

  if [ -f "/tmp/${SERVER}-databases-drop" ]; then
    shw_grey "To remove these databases:"
    cat /tmp/${SERVER}-databases-drop
  fi
done
