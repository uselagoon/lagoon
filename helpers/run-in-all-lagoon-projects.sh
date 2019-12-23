#!/bin/bash

set -e -o pipefail

OC="oc"

oc get configmaps --all-namespaces --no-headers  | grep lagoon-env | awk '{ print $1 }' | while read OPENSHIFT_PROJECT; do
  REGEX=${REGEX:-.*}
  if [[ $OPENSHIFT_PROJECT =~ $REGEX ]]; then
    . "$1"
  fi
done