#!/bin/bash -xe

set -o pipefail

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f ${OPENSHIFT_TEMPLATE} \
  -p SERVICE_NAME="${SERVICE_NAME}" \
  -p SAFE_BRANCH="${SAFE_BRANCH}" \
  -p SAFE_SITEGROUP="${SAFE_SITEGROUP}" \
  -p BRANCH="${BRANCH}" \
  -p SITEGROUP="${SITEGROUP}" \
  -p AMAZEEIO_GIT_SHA="${AMAZEEIO_GIT_SHA}" \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -
