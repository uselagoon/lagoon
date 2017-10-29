#!/bin/bash -x

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f "${ADDITIONAL_YAML_PATH}" \
  -p SAFE_BRANCH="${SAFE_BRANCH}" \
  -p SAFE_PROJECT="${SAFE_PROJECT}" \
  -p BRANCH="${BRANCH}" \
  -p PROJECT="${PROJECT}" \
  -p AMAZEEIO_GIT_SHA="${AMAZEEIO_GIT_SHA}" \
  -p OPENSHIFT_PROJECT=${OPENSHIFT_PROJECT} \
  | oc ${ADDITIONAL_YAML_COMMAND} --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f - || ${ADDITIONAL_YAML_IGNORE_ERROR}