#!/bin/bash

# Description: script to remove old .kibana* indexes' aliases created after Kibana
# restart.
#
# The aim of the script is to keep only the latest index with the latest 
# configuration, and delete the old ones.

# Usage is: CLUSTER="amazeeio-test" ELASTICSEARCH_NAMESPACE="elasticsearch" ./clean-kibana-indexes.sh"

set -eu -o pipefail

# Cluster to connect to
CLUSTER="${CLUSTER:-""}"
if [ -z "$CLUSTER" ]; then
	echo -e "Set CLUSTER variable\n"
	echo -e "Usage is: CLUSTER="amazeeio-test" ELASTICSEARCH_NAMESPACE="elasticsearch" ./clean-kibana-indexes.sh"
	exit 1
fi

# Switch context to the selected cluster
echo -e "You're switching context to ${CLUSTER}"
kubectl config use-context "${CLUSTER}"

# Elasticsearch namespace of the cluster
ELASTICSEARCH_NAMESPACE="${ELASTICSEARCH_NAMESPACE:-""}"

if [ -z "$ELASTICSEARCH_NAMESPACE" ]; then
	echo -e "\nSet ELASTICSEARCH_NAMESPACE variable"
	echo -e "Usage is: CLUSTER="amazeeio-test" ELASTICSEARCH_NAMESPACE="elasticsearch" ./clean-kibana-indexes.sh\n"
	exit 1
fi

# Elasticsearch POD where run the script
ELASTICSEARCH_POD="${ELASTICSEARCH_POD:-$(kubectl -n "$ELASTICSEARCH_NAMESPACE" get pods --no-headers -o custom-columns=NAME:.metadata.name|head -n1)}"
echo -e "Selected POD to run commands is $ELASTICSEARCH_POD"

# Generate script dynamically and pipe to the selected POD
cat << EOF |
#/bin/bash
IFS=$'\n'

# Generate array with kibana aliases
ELASTICSEARCH_ALIASES=(\$(es-curl GET "_cat/aliases/.kibana*?h=alias,index"))

# For each row, get current alias and index
for ALIAS_ROW in "\${ELASTICSEARCH_ALIASES[@]}"
do
	ALIAS=\$(echo \$ALIAS_ROW|awk '{print \$1}')
	INDEX=\$(echo \$ALIAS_ROW|awk '{print \$2}')
	echo "\$ALIAS is the alias for \$INDEX"
	
	# Generate an arry with old indexes to remove
	OLD_INDEXES=(\$(es-curl GET "_cat/indices/\$ALIAS*?h=index" -s |grep -v \$INDEX))
		for OLD_INDEX in "\${OLD_INDEXES[@]}"
		do
			echo "Going to remove \$OLD_INDEX with es-curl DELETE \$OLD_INDEX"
			es-curl DELETE \$OLD_INDEX
		done
done
unset IFS
EOF

# Execute the script in the selected POD
kubectl -n ${ELASTICSEARCH_NAMESPACE} exec ${ELASTICSEARCH_POD} sh -it -
