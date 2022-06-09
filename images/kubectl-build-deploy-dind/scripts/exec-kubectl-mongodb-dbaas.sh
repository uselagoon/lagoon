#!/bin/bash

# The operator can sometimes take a bit, wait until the details are available
# We added a timeout of 10 minutes (120 retries) before exit
OPERATOR_COUNTER=1
OPERATOR_TIMEOUT=180
# use the secret name from the consumer to prevent credential clash
until kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.database
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
DB_HOST=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.services.primary)
DB_USER=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.username)
DB_PASSWORD=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.password)
DB_NAME=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.database)
DB_PORT=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.provider.port)
DB_AUTHSOURCE=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.provider.auth.source)
DB_AUTHMECHANISM=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.provider.auth.mechanism)
DB_AUTHTLS=$(kubectl -n ${NAMESPACE} get mongodbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.provider.auth.tls)

# Add credentials to our configmap, prefixed with the name of the servicename of this servicebroker
kubectl patch \
    -n ${NAMESPACE} \
    configmap lagoon-env \
    -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_HOST\":\"${DB_HOST}\", \"${SERVICE_NAME_UPPERCASE}_USERNAME\":\"${DB_USER}\", \"${SERVICE_NAME_UPPERCASE}_PASSWORD\":\"${DB_PASSWORD}\", \"${SERVICE_NAME_UPPERCASE}_DATABASE\":\"${DB_NAME}\", \"${SERVICE_NAME_UPPERCASE}_PORT\":\"${DB_PORT}\", \"${SERVICE_NAME_UPPERCASE}_AUTHSOURCE\":\"${DB_AUTHSOURCE}\", \"${SERVICE_NAME_UPPERCASE}_AUTHMECHANISM\":\"${DB_AUTHMECHANISM}\", \"${SERVICE_NAME_UPPERCASE}_AUTHTLS\":\"${DB_AUTHTLS}\" }}"

set -x
