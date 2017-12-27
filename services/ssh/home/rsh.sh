#!/bin/bash

# takes arguments:
# 1: name of oc project
# 2(optional): override for deploymentconfig

if [[ "$1" =~ ^[A-Za-z0-9-]+$ ]]; then
  project=$1
else
  echo "ERROR: no project defined";
  exit
fi

if [[ "$2" =~ ^[A-Za-z0-9-]+$ ]]; then
  deploymentconfig=$2
else
  deploymentconfig=cli
fi

exec /usr/bin/oc -n ${project} rsh dc/${deploymentconfig} $SSH_ORIGINAL_COMMAND
