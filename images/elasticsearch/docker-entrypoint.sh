#!/usr/bin/env bash

set -eo pipefail

if [ ! -z "$EXTRA_OPTS" ]; then
  echo -e "${EXTRA_OPTS}" >> /usr/share/elasticsearch/config/elasticsearch.yml
fi

if [ -z "$POD_NAMESPACE" ]; then
  # Single container runs in docker
  echo "POD_NAMESPACE not set, spin up single node"
else
  # Is running in Kubernetes/OpenShift, so find all other pods
  # belonging to the namespace
  echo "Elasticsearch: Finding peers"
  K8S_SVC_NAME=$(hostname -f | cut -d"." -f2)
  echo "Using service name: ${K8S_SVC_NAME}"
  # copy the pristine version to the one that can be edited
  /usr/bin/peer-finder -on-start="/lagoon/configure-es.sh" -service=${K8S_SVC_NAME}
fi
