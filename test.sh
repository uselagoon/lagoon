#!/bin/bash -x
IDLING_ENDPOINTS=$(oc get endpoints -o json | jq  --raw-output '[ .items[] | select(.metadata.annotations | has("idling.alpha.openshift.io/unidle-targets")) | .metadata.name ] | join(" ")')
if [[ "${IDLING_ENDPOINTS}" ]]; then
  ALL_IDLED_SERVICES_JSON=$(oc get endpoints -o json | jq --raw-output '[ .items[] | select(.metadata.annotations | has("idling.alpha.openshift.io/unidle-targets")) | .metadata.annotations."idling.alpha.openshift.io/unidle-targets" | fromjson | .[] ] | unique_by(.name) | tojson')
  oc annotate --overwrite endpoints $IDLING_ENDPOINTS "idling.alpha.openshift.io/unidle-targets=${ALL_IDLED_SERVICES_JSON}"
fi