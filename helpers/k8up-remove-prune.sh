#!/bin/bash

if [ -z "$OPENSHIFT_PROJECT" ]; then
  echo "OPENSHIFT_PROJECT not set"
  exit 1
fi

set -e -o pipefail

echo "${OPENSHIFT_PROJECT}: starting =================================================================="

if oc -n "${OPENSHIFT_PROJECT}" patch schedule backup-schedule --type=json -p="[{\"op\": \"remove\", \"path\": \"/spec/prune\"}]" 2>/dev/null; then
  echo "${OPENSHIFT_PROJECT}: patched backup-schedule"
else
  echo "${OPENSHIFT_PROJECT}: backup-schedule already patched"
fi

echo "${OPENSHIFT_PROJECT}: done =================================================================="
