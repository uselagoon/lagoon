#!/bin/bash

# The operator can sometimes take a bit, wait until the details are available
# We added a timeout of 10 minutes (120 retries) before exit
OPERATOR_COUNTER=1
OPERATOR_TIMEOUT=180

# check for the database in the consumer, once it exists it means the operator has done its job
until oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.database
do
if [ $OPERATOR_COUNTER -lt $OPERATOR_TIMEOUT ]; then
    let OPERATOR_COUNTER=OPERATOR_COUNTER+1
    echo "Service for ${SERVICE_NAME} not available yet, waiting for 5 secs"
    sleep 5
else
    echo "Timeout of $OPERATOR_TIMEOUT for ${SERVICE_NAME} creation reached"
    exit 1
fi
done
set +x
# Grab the details from the consumer spec
DB_HOST=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.services.primary)
DB_USER=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.username)
DB_PASSWORD=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.password)
DB_NAME=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.database)
DB_PORT=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.provider.port)

# Add credentials to our configmap, prefixed with the name of the servicename of this servicebroker
oc patch --insecure-skip-tls-verify \
    -n ${OPENSHIFT_PROJECT} \
    configmap lagoon-env \
    -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_HOST\":\"${DB_HOST}\", \"${SERVICE_NAME_UPPERCASE}_USERNAME\":\"${DB_USER}\", \"${SERVICE_NAME_UPPERCASE}_PASSWORD\":\"${DB_PASSWORD}\", \"${SERVICE_NAME_UPPERCASE}_DATABASE\":\"${DB_NAME}\", \"${SERVICE_NAME_UPPERCASE}_PORT\":\"${DB_PORT}\"}}"

# only add the DB_READREPLICA_HOSTS variable if it exists in the consumer spec
# since the operator can support multiple replica hosts being defined, we should comma seperate them here
if DB_READREPLICA_HOSTS=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.services.replicas); then
    DB_READREPLICA_HOSTS=$(echo $DB_READREPLICA_HOSTS | cut -c 3- | rev | cut -c 1- | rev | sed 's/^\|$//g' | paste -sd, -)
    oc patch --insecure-skip-tls-verify \
    -n "$OPENSHIFT_PROJECT" \
    configmap lagoon-env \
    -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_READREPLICA_HOSTS\":\"${DB_READREPLICA_HOSTS}\"}}"
fi
set -x