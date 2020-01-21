#!/bin/bash

# Check if the MariaDBConsumer exists and create if not
if kubectl -n ${NAMESPACE} get "${SERVICEBROKER_CLASS}" "${SERVICE_NAME}" &> /dev/null; then
  echo "${SERVICEBROKER_CLASS} ${SERVICE_NAME} already existing, not attempting to update"
else
  # apply the MariaDBConsume from the template
  cat ${KUBERNETES_SERVICES_TEMPLATE} | \
    sed "s/{{SERVICE_NAME}}/${SERVICE_NAME}/g" | \
    sed "s/{{SERVICEBROKER_PLAN}}/${SERVICEBROKER_PLAN}/g" | \
    kubectl apply -f -
fi

# # Check if the resulting Secret from the ServiceBinding exists and create if not.
# if oc --insecure-skip-tls-verify -n ${NAMESPACE} get secret "${SERVICE_NAME}-servicebroker-credentials" &> /dev/null; then
#   echo "Secret '${SERVICE_NAME}-servicebroker-credentials' already existing, not attempting to update"
# else
#   # Sometimes the secret is not existing anymore even though the binding still exists.
#   # Not exactly sure yet how and why that happens, but we handle it with unbinding first and then bind again.
#   if svcat -n ${NAMESPACE} get bindings "${SERVICE_NAME}-servicebroker-credentials" &> /dev/null; then
#     echo "WARNING: Binding '${SERVICE_NAME}-servicebroker-credentials' existing, but the secret not, unbinding and bind again."
#     svcat -n ${NAMESPACE} unbind ${SERVICE_NAME} --name "${SERVICE_NAME}-servicebroker-credentials" --wait
#     # wait 5 seconds as sometimes the unbinding is not fully through yet
#     sleep 5
#   fi
#   # Create the binding, the secret will be named after the name of the binding.
#   svcat -n ${NAMESPACE} bind ${SERVICE_NAME} --name "${SERVICE_NAME}-servicebroker-credentials"
# fi