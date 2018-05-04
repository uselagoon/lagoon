#!/bin/bash
set -x
set -eo pipefail

THIS_IS_TUG=true

# Import environment variables with keeping overwritten env variables
TMPFILE=$(mktemp -t dotenv.XXXXXXXX)
export -p > $TMPFILE

# set -a is short for `set -o allexport` which will export all variables in a file
set -a
. /oc-build-deploy/tug/env
set +a

# now export all previously existing environments variables so they are stronger than maybe existing ones in the dotenv files
. $TMPFILE || true
# remove the tmpfile
rm $TMPFILE



OPENSHIFT_REGISTRY=docker-registry.default.svc:5000
OPENSHIFT_PROJECT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
REGISTRY_REPOSITORY=$OPENSHIFT_PROJECT

if [ "$CI_USE_OPENSHIFT_REGISTRY" == "true" ]; then
  CI_OVERRIDE_IMAGE_REPO=${OPENSHIFT_REGISTRY}/lagoon
else
  CI_OVERRIDE_IMAGE_REPO=""
fi

if [ ! -f .lagoon.yml ]; then
  echo "no .lagoon.yml file found"; exit 1;
fi

DEPLOYER_TOKEN=$(cat /var/run/secrets/lagoon/deployer/token)

oc login --insecure-skip-tls-verify --token="${DEPLOYER_TOKEN}" https://kubernetes.default.svc

. /oc-build-deploy/build-deploy-docker-compose.sh
