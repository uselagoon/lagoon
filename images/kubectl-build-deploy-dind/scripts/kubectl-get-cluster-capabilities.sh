#!/bin/bash

CAPABILITIES=()
# Load all api groups and versions from the API, add them to capabilities
while IFS='/' read -ra VERSION; do # api groups and versions are separated by `/`

  if [[ "${VERSION[0]}" == "v1" ]]; then
    # special case for the empty API Group
    API_GROUP=""
    API_VERSION="v1"
    CAPABILITIES+=("${API_VERSION}")
  else
    API_GROUP="${VERSION[0]}"
    API_VERSION="${VERSION[1]}"
    CAPABILITIES+=("${API_GROUP}/${API_VERSION}")
  fi

  # Load all resources for the found api group and add them to the capabilities
  while read RESOURCE; do
    if [[ "${API_GROUP}" = "" ]]; then
      CAPABILITIES+=("${API_VERSION}/${RESOURCE}")
    else
      CAPABILITIES+=("${API_GROUP}/${API_VERSION}/${RESOURCE}")
    fi
  done < <(kubectl api-resources --no-headers --cached  --namespaced=true --api-group="${API_GROUP}" | awk '{print $NF}' )

done < <(kubectl api-versions)
