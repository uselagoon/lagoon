#!/bin/bash

# Check if the ServiceInstance exists and create if not
if svcat -n ${OPENSHIFT_PROJECT} get instances "${SERVICE_NAME}" &> /dev/null; then
  echo "ServiceInstance ${SERVICE_NAME} already existing, not attempting to update"
else
  # Provision the Instance
  svcat -n ${OPENSHIFT_PROJECT} provision "${SERVICE_NAME}" --class "${SERVICEBROKER_CLASS}" --plan "${SERVICEBROKER_PLAN}"
fi

# Check if the resulting Secret from the ServiceBinding exists and create if not.
if oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get secret "${SERVICE_NAME}-servicebroker-credentials" &> /dev/null; then
  echo "Secret '${SERVICE_NAME}-servicebroker-credentials' already existing, not attempting to update"
else
  # Sometimes the secret is not existing anymore even though the binding still exists.
  # Not exactly sure yet how and why that happens, but we handle it with unbinding first and then bind again.
  if svcat -n ${OPENSHIFT_PROJECT} get bindings "${SERVICE_NAME}-servicebroker-credentials" &> /dev/null; then
    echo "WARNING: Binding '${SERVICE_NAME}-servicebroker-credentials' existing, but the secret not, unbinding and bind again."
    svcat -n ${OPENSHIFT_PROJECT} unbind ${SERVICE_NAME} --name "${SERVICE_NAME}-servicebroker-credentials" --wait
    # wait 5 seconds as sometimes the unbinding is not fully through yet
    sleep 5
  fi
  # Create the binding, the secret will be named after the name of the binding.
  svcat -n ${OPENSHIFT_PROJECT} bind ${SERVICE_NAME} --name "${SERVICE_NAME}-servicebroker-credentials"
fi