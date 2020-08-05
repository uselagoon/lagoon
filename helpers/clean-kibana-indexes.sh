#!/bin/bash

# Description: script to remove old .kibana* indexes' aliases created after Kibana
# restart.
#
# The aim of the script is to keep only the latest index with the latest 
# configuration, and delete the old ones.

# Usage is: 
# CLUSTER="amazeeio-test" ELASTICSEARCH_NAMESPACE="elasticsearch" ./clean-kibana-indexes.sh"
# CLUSTER="amazeeio-test" ELASTICSEARCH_NAMESPACE="elasticsearch" TENANT="drupalexample" ./clean-kibana-indexes.sh"

set -eu

# Set DEBUG variable to true, to start bash in debug mode
DEBUG="${DEBUG:-"false"}"
if [ "$DEBUG" = "true" ]; then
        set -x
fi

# Cluster to connect to
CLUSTER="${CLUSTER:-""}"
if [ -z "$CLUSTER" ]; then
	echo -e "Set CLUSTER variable\n"
	echo -e "Usage is: CLUSTER="amazeeio-test" ELASTICSEARCH_NAMESPACE="elasticsearch" ./clean-kibana-indexes.sh"
	exit 1
fi

# Set the ACTION of the script between CLOSE or DELETE
ACTION="${ACTION:-""}"
if [ -z "$ACTION" ]; then
	echo -e "Set ACTION variable to CLOSE or DELETE\n"
	echo -e "Usage is: CLUSTER="amazeeio-test" ELASTICSEARCH_NAMESPACE="elasticsearch" ACTION=CLOSE ./clean-kibana-indexes.sh"
	exit 1
fi

# Set DRYRUN option to "true" to run in a dry-run mode
DRYRUN="${DRYRUN:-"false"}"

# Optional set a tenant to check and close/delete indexes
TENANT="${TENANT:-"*"}"
if [ "$TENANT" = "*" ]; then
	REGEX="*"
# This is a special tenant that requires a special REGEX
elif [ "$TENANT" = "kibana" ]; then
	REGEX=""
else
	REGEX="_*_$TENANT"
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

# Generate array with kibana aliases for a specific tenant if specified, otherwise get all aliases
ELASTICSEARCH_ALIASES=(\$(es-curl GET "_cat/aliases/.kibana$REGEX?h=alias,index"))

# For each row, get current alias and index
for ALIAS_ROW in "\${ELASTICSEARCH_ALIASES[@]}"
do
	ALIAS=\$(echo \$ALIAS_ROW|awk '{print \$1}')
	INDEX=\$(echo \$ALIAS_ROW|awk '{print \$2}')
	echo "\$ALIAS is the alias for \$INDEX"
	
	# Generate an arry with old indexes to remove
	if [ "$TENANT" = "kibana" ]; then
		# This fix avoids the "catch-all" .kibana* regex
		OLD_INDEXES=(\$(es-curl GET "_cat/indices/.kibana*?h=index" -s |grep -E '^.kibana_?[0-9]$'| grep -v -w \$INDEX))
	else
		OLD_INDEXES=(\$(es-curl GET "_cat/indices/\$ALIAS*?h=index" -s |grep -v -w \$INDEX))
	fi
	for OLD_INDEX in "\${OLD_INDEXES[@]}"
	do
		if [ "$ACTION" = "CLOSE" ]; then
			echo "Going to close \$OLD_INDEX with es-curl POST \$OLD_INDEX/_close"
			if [ "$DRYRUN" = "false" ]; then
				echo "CLOSE INDEX"
				es-curl POST \$OLD_INDEX/_close
			fi
		elif [ "$ACTION" = "DELETE" ]; then
			echo "Going to delete \$OLD_INDEX with es-curl DELETE \$OLD_INDEX"
			if [ "$DRYRUN" = "false" ]; then
				echo "DELETE INDEX"
				es-curl DELETE \$OLD_INDEX
			fi
		else
			echo "Wrong action choosen"
			exit 1
		fi
	done
done
unset IFS
EOF

# Execute the script in the selected POD
kubectl -n ${ELASTICSEARCH_NAMESPACE} exec ${ELASTICSEARCH_POD} sh -it -
