#!/bin/bash

# The operator can sometimes take a bit, wait until the details are available
# We added a timeout of 10 minutes (120 retries) before exit
SERVICE_BROKER_COUNTER=1
SERVICE_BROKER_TIMEOUT=180
# use the secret name from the consumer to prevent credential clash
until kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.database
do
if [ $SERVICE_BROKER_COUNTER -lt $SERVICE_BROKER_TIMEOUT ]; then
    let SERVICE_BROKER_COUNTER=SERVICE_BROKER_COUNTER+1
    echo "Service for ${SERVICE_NAME} not available yet, waiting for 5 secs"
    sleep 5
else
    echo "Timeout of $SERVICE_BROKER_TIMEOUT for ${SERVICE_NAME} creation reached"
    exit 1
fi
done
set +x
# Grab the details from the consumer spec
DB_HOST=$(kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.services.primary)
DB_USER=$(kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.username)
DB_PASSWORD=$(kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.password)
DB_NAME=$(kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.consumer.database)
DB_PORT=$(kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get mariadbconsumer/${SERVICE_NAME} -o yaml | shyaml get-value spec.provider.port)

# Add credentials to our configmap, prefixed with the name of the servicename of this servicebroker
kubectl patch --insecure-skip-tls-verify \
    -n ${NAMESPACE} \
    configmap lagoon-env \
    -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_HOST\":\"${DB_HOST}\", \"${SERVICE_NAME_UPPERCASE}_USERNAME\":\"${DB_USER}\", \"${SERVICE_NAME_UPPERCASE}_PASSWORD\":\"${DB_PASSWORD}\", \"${SERVICE_NAME_UPPERCASE}_DATABASE\":\"${DB_NAME}\", \"${SERVICE_NAME_UPPERCASE}_PORT\":\"${DB_PORT}\"}}"
set -x