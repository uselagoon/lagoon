#!/bin/bash -xe

set -o pipefail

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f ${OPENSHIFT_TEMPLATE} \
  -v SERVICE_NAME="${SERVICE_NAME}" \
  -v SAFE_BRANCH="${SAFE_BRANCH}" \
  -v SAFE_SITEGROUP="${SAFE_SITEGROUP}" \
  -v BRANCH="${BRANCH}" \
  -v SITEGROUP="${SITEGROUP}" \
  -v AMAZEEIO_GIT_SHA="${AMAZEEIO_GIT_SHA}" \
  -v ROUTER_URL=${OPENSHIFT_ROUTER_URL} \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -
