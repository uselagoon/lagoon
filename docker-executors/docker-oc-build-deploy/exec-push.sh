#!/bin/bash -xe

set -o pipefail

docker tag ${IMAGE} ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SERVICE}:latest

for i in {1..2}; do docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SERVICE}:latest && break || sleep 5; done

