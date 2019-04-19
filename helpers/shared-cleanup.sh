#!/bin/sh

for util in oc svcat jq; do
which ${util} > /dev/null
if [ $? -gt 0 ]; then
  echo "please install ${util}"
  exit 1
fi
done;


# services with a port are not servicebrokers.
echo "getting a list of services for cluster $(oc whoami --show-server)..."
oc get service --all-namespaces |grep mariadb  |grep -v 3306  > mariadb-services

# get a list of database servers
SERVERS=$(awk '{print $3}' mariadb-services | sort |uniq )

for SERVER in $SERVERS; do
  echo "getting database list for server ${SERVER}..."
  ssh $SERVER mysql -se 'show\ databases;' > ${SERVER}-databases
done


for PROJECT in $(awk '{print $1}' mariadb-services); do
  DBHOST=$(grep $PROJECT mariadb-services | awk '{print $3}')
  DATABASE=$(oc -n $PROJECT get configmap lagoon-env -o json | jq -r ".data.MARIADB_DATABASE")

  echo checking project $PROJECT
  echo found database $DATABASE on host $DBHOST
  sed -i /$DATABASE/d ${SERVER}-databases



  # BINDING=$(svcat -n $PROJECT  get bindings -o json | jq -r ".items[0].metadata.name")
  # echo "binding for $PROJECT is $BINDING ..."
  # svcat -n $PROJECT describe bindings $BINDING --show-secrets #| grep DB_NAME | awk '{print $2}'

done
