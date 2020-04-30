#!/bin/bash -x

oc process  --local -o yaml --insecure-skip-tls-verify \
  -n ${NAMESPACE} \
  -f "${ADDITIONAL_YAML_PATH}" \
  -p SAFE_BRANCH="${SAFE_BRANCH}" \
  -p SAFE_PROJECT="${SAFE_PROJECT}" \
  -p BRANCH="${BRANCH}" \
  -p PROJECT="${PROJECT}" \
  -p LAGOON_GIT_SHA="${LAGOON_GIT_SHA}" \
  -p NAMESPACE=${NAMESPACE} \
  | oc ${ADDITIONAL_YAML_COMMAND} --insecure-skip-tls-verify -n ${NAMESPACE} -f - || ${ADDITIONAL_YAML_IGNORE_ERROR}