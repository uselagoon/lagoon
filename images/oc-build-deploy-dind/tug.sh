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

if [ "$CI" == "true" ]; then
  CI_OVERRIDE_IMAGE_REPO=${OPENSHIFT_REGISTRY}/lagoon
else
  CI_OVERRIDE_IMAGE_REPO=""
fi

if [ ! -f .lagoon.yml ]; then
  echo "no .lagoon.yml file found"; exit 1;
fi

# Possibility to switch to legacy OC version via Environment variable OC_VERSION_OVERRIDE
if [[ $OC_VERSION_OVERRIDE == "true" ]]; then
  echo "Switching to legacy OC"
  # Defining Versions - this version is supposed to be v3.7.2 to be backwards compatible
  LEGACY_OC_VERSION=v3.7.2
  LEGACY_OC_HASH=282e43f
  LEGACY_OC_SHA256=abc89f025524eb205e433622e59843b09d2304cc913534c4ed8af627da238624
  curl -Lo /tmp/openshift-origin-client-tools.tar https://github.com/openshift/origin/releases/download/${LEGACY_OC_VERSION}/openshift-origin-client-tools-${LEGACY_OC_VERSION}-${LEGACY_OC_HASH}-linux-64bit.tar.gz \
      && echo "$LEGACY_OC_SHA256  /tmp/openshift-origin-client-tools.tar" | sha256sum -c - \
      && mkdir /tmp/openshift-origin-client-tools \
      && mkdir /usr/bin-legacy/ \
      && tar -xzf /tmp/openshift-origin-client-tools.tar -C /tmp/openshift-origin-client-tools --strip-components=1 \
      && install /tmp/openshift-origin-client-tools/oc /usr/bin/oc && rm -rf /tmp/openshift-origin-client-tools  && rm -rf /tmp/openshift-origin-client-tools.tar
fi

DEPLOYER_TOKEN=$(cat /var/run/secrets/lagoon/deployer/token)

oc login --insecure-skip-tls-verify --token="${DEPLOYER_TOKEN}" https://kubernetes.default.svc

. /oc-build-deploy/build-deploy-docker-compose.sh
