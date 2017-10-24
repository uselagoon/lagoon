#!/bin/bash -x

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f "${ADDITIONAL_YAML_PATH}" \
  -p SAFE_BRANCH="${SAFE_BRANCH}" \
  -p SAFE_SITEGROUP="${SAFE_SITEGROUP}" \
  -p BRANCH="${BRANCH}" \
  -p SITEGROUP="${SITEGROUP}" \
  -p AMAZEEIO_GIT_SHA="${AMAZEEIO_GIT_SHA}" \
  -p PROJECT=${OPENSHIFT_PROJECT} \
  | oc ${ADDITIONAL_YAML_COMMAND} --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f - || ${ADDITIONAL_YAML_IGNORE_ERROR}