#!/usr/bin/env bash

##
# Label all namespaces with lagoon info
#
# Old environments weren't labelled the way that Lagoon expects. This script
# can be run against a cluster to add the missing labels.

set -euo pipefail
#set -x

# Loop through all oc projects.
while read -r project ; do

    # Check if lagoon-env configmap exists.
    if oc get configmap -n "$project" lagoon-env >/dev/null 2>&1; then

        echo "################################################"
        echo "Annotating project: $project..."
        echo "################################################"    

        LAGOON_PROJECT=$(oc get configmaps -n "$project" lagoon-env -o yaml | awk '/LAGOON_PROJECT:/ { print $2 }')
        LAGOON_ENVIRONMENT_TYPE=$(oc get configmaps -n "$project" lagoon-env -o yaml | awk '/LAGOON_ENVIRONMENT_TYPE:/ { print $2 }')
        LAGOON_GIT_SAFE_BRANCH=$(oc get configmaps -n "$project" lagoon-env -o yaml | awk '/LAGOON_GIT_SAFE_BRANCH:/ { print $2 }')
        MARIADB_DATABASE=$(oc get configmaps -n "$project" lagoon-env -o yaml | awk '/MARIADB_DATABASE:/ { print $2 }')
        MARIADB_USERNAME=$(oc get configmaps -n "$project" lagoon-env -o yaml | awk '/MARIADB_USERNAME:/ { print $2 }')

        oc label namespace "$project" "lagoon.sh/project=$LAGOON_PROJECT" --overwrite
        oc label namespace "$project" "lagoon.sh/environmentType=$LAGOON_ENVIRONMENT_TYPE" --overwrite
        oc label namespace "$project" "lagoon.sh/environment=$LAGOON_GIT_SAFE_BRANCH" --overwrite
        oc label namespace "$project" "lagoon.sh/mariadb-schema=$MARIADB_DATABASE" --overwrite
        oc label namespace "$project" "lagoon.sh/mariadb-username=$MARIADB_USERNAME" --overwrite
    else

        echo "No lagoon-env configmap found for $project"

    fi

done < <(oc get ns -l '!lagoon.sh/project' | sed '1d' | awk '{print $1}')
