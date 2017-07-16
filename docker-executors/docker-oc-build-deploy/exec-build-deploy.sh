#!/bin/bash -xe

set -o pipefail

docker build --build-arg IMAGE_REPO=$CI_OVERRIDE_IMAGE_REPO --build-arg AMAZEEIO_GIT_SHA="$AMAZEEIO_GIT_SHA" --build-arg AMAZEEIO_GIT_BRANCH="$BRANCH" --build-arg AMAZEEIO_SITEGROUP="$SITEGROUP" -t $IMAGE -f $DOCKERFILE .

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f ${OPENSHIFT_TEMPLATE} \
  -v SERVICE_NAME="${SERVICE}" \
  -v SAFE_BRANCH="${SAFE_BRANCH}" \
  -v SAFE_SITEGROUP="${SAFE_SITEGROUP}" \
  -v BRANCH="${BRANCH}" \
  -v SITEGROUP="${SITEGROUP}" \
  -v AMAZEEIO_GIT_SHA="${AMAZEEIO_GIT_SHA}" \
  -v ROUTER_URL=${OPENSHIFT_ROUTER_URL} \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -

docker tag ${IMAGE} ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SERVICE}:latest

for i in {1..2}; do docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SERVICE}:latest && break || sleep 5; done

