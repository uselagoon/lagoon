#!/usr/bin/env bash

# this script will assumed you're logged into an openshift master host.
# and that you can connect directly to the database servers listed in DB_HOST
# on port 3306 with a .my.cnf that allows you to run
# non-interactive mysql commands.

# Hint: use  oc -n openshift-ansible-service-broker get secret/lagoon-dbaas-db-credentials to
# create .my.cnf

# after running this script, the user will be presented with a list of
# databases that are probably ok to remove.

for util in oc svcat jq mysql; do
which ${util} > /dev/null
if [ $? -gt 0 ]; then
  echo "please install ${util}"
  exit 1
fi
done;


# services with a port are not servicebrokers.
echo "getting a list of services for cluster $(oc whoami --show-server)..."
# oc get service --all-namespaces |grep mariadb  |grep -v 3306  > mariadb-services

# get a list of database servers
SERVERS=$(awk '{print $3}' mariadb-services | sort |uniq )

for SERVER in $SERVERS; do
  CONFFILE=${HOME}/.my.cnf-${SERVER}
  if [ -f $CONFFILE ]; then
    echo "getting database list for server ${SERVER}..."
    mysql --defaults-file=$CONFFILE -se 'show\ databases;' | egrep -v mysql$\|_schema$ > ${SERVER}-databases
  else
    echo ERROR: please create $CONFFILE so I can know how to connect to $SERVER
    exit 2
  fi
done

errors=()
for PROJECT in $(awk '{print $1}' mariadb-services); do
  echo checking project $PROJECT
  DBHOST=$(grep ^${PROJECT}\  mariadb-services | awk '{print $3}')
  DATABASE=$(oc -n $PROJECT get configmap lagoon-env -o json | jq -r '.data | with_entries(select(.key|match("_DATABASE";"i")))[]')

  if [ -z $DATABASE ]; then
    echo "some problem with $PROJECT"
    errors+=("$PROJECT")
  else
    echo found database $DATABASE on host $DBHOST
    sed -ibak -e "/${DATABASE}/d" ${DBHOST}-databases
  fi
done

echo; echo 
echo These projects could not adaquately checked:
printf "%s\\n" "${errors[@]}"
echo


for SERVER in $SERVERS; do
  echo "Orphaned databases for: ${SERVER}..."
  cat ${SERVER}-databases
  echo
done
