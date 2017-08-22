#!/bin/bash -xe

set -o pipefail

docker tag ${IMAGE}-$SERVICE ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SERVICE}:latest

for i in {1..4}; do docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SERVICE}:latest && break || sleep 5; done

