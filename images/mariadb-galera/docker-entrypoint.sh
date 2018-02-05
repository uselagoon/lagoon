#!/bin/bash
#
# Adfinis SyGroup AG
# openshift-mariadb-galera: Container entrypoint
#

set -e
set -x

# Locations
CONTAINER_SCRIPTS_DIR="/usr/share/container-scripts/mysql"
EXTRA_DEFAULTS_FILE="/var/lib/mysql/.conf.d/galera.cnf"

# Check if the container runs in Kubernetes/OpenShift
if [ -z "$POD_NAMESPACE" ]; then
	# Single container runs in docker
	echo "POD_NAMESPACE not set, spin up single node"
else
	# Is running in Kubernetes/OpenShift, so find all other pods
	# belonging to the namespace
	echo "Galera: Finding peers"
	K8S_SVC_NAME=$(hostname -f | cut -d"." -f2)
	echo "Using service name: ${K8S_SVC_NAME}"
  mkdir -p /var/lib/mysql/.conf.d/
	cp ${CONTAINER_SCRIPTS_DIR}/galera.cnf ${EXTRA_DEFAULTS_FILE}
	/usr/bin/peer-finder -on-start="${CONTAINER_SCRIPTS_DIR}/configure-galera.sh" -service=${K8S_SVC_NAME}
fi


# We assume that mysql needs to be setup if this directory is not present
if [ ! -d "/var/lib/mysql/mysql" ]; then
	echo "Configure first time mysql"
	${CONTAINER_SCRIPTS_DIR}/configure-mysql.sh
fi


# Run mysqld
exec mysqld
