#!/bin/bash

# set -e -o pipefail

# Create an JWT Admin Token to talk to the API
API_ADMIN_JWT_TOKEN=$(./create_jwt.sh)
BEARER="Authorization: bearer $API_ADMIN_JWT_TOKEN"

# Load all projects and their environments
GRAPHQL='query developmentEnvironments {
  developmentEnvironments:allProjects {
    name
    openshift {
      console_url
      token
      name
    }
    environments {
      openshift_projectname
      name
    }
  }
}'
# Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
query=$(echo $GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
ALL_ENVIRONMENTS=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" api:3000/graphql -d "{\"query\": \"$query\"}")

# Filter only projects that actually have an environment
# Loop through each found project
echo "$ALL_ENVIRONMENTS" | jq -c '.data.developmentEnvironments[] | select((.environments|length)>=1)' | while read project
  do
    PROJECT_NAME=$(echo "$project" | jq -r '.name')
    OPENSHIFT_URL=$(echo "$project" | jq -r '.openshift.console_url')

    # Match the Project name to the Project Regex
    if [[ $PROJECT_NAME =~ ^$PROJECT_REGEX$ ]]; then
      OPENSHIFT_TOKEN=$(echo "$project" | jq -r '.openshift.token')
      echo "$OPENSHIFT_URL - $PROJECT_NAME: Found "

      # loop through each environment of the current lagoon project
      echo "$project" | jq -c '.environments[]' | while read environment
      do
        ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshift_projectname')
        ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')

        # First check if this openshift project exists
        echo "$OPENSHIFT_URL - $PROJECT_NAME: handling environment $ENVIRONMENT_NAME"
        if ! oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" get project "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" > /dev/null; then
          echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: OpenShift Project not found"
          continue;
        fi

        # Check for Deploymentconfigs wich are clis
        DEPLOYMENTCONFIGS=$(set -e -o pipefail; oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get dc -l service=cli -o name)
        if [ "$DEPLOYMENTCONFIGS" == "" ]; then
          echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: No deploymentconfigs for cli found"
          continue;
        fi

        # Loop through all found deploymentconfigs
        printf '%s\n' "$DEPLOYMENTCONFIGS" | while IFS= read -r deploymentconfig
        do
          echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: handling $deploymentconfig"

          # Check first if deploymentconfig has running replicas
          HAS_RUNNING_REPLICAS=$(set -e -o pipefail; oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get $deploymentconfig -o json | jq '.status.replicas | if . > 0 then true else false end')
          if [ ! $? -eq 0 ]; then
              echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: $deploymentconfig: error checking for running pods"
              continue
          # Has running replicas
          elif [ "$HAS_RUNNING_REPLICAS" == "true" ]; then
            echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: $deploymentconfig: has running pods, checking if they are non-busy"

            # Now check if the container has only the entrypoint processes running (done with `ps --no-headers a` which only shows processes that have a tty)
            RUNNING_PROCESSES=$(set -e -o pipefail; oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" rsh $deploymentconfig ps --no-headers a | grep -v ps | wc -l | tr -d ' ')
            if [ ! $? -eq 0 ]; then
              echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: $deploymentconfig: error checking for busy-ness of pods"
              continue
            elif [ "$RUNNING_PROCESSES" == "0" ]; then
              # Now we can scale
              echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: $deploymentconfig: not busy, scaling to 0"
              set -x
              oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" scale --replicas=0 $deploymentconfig
              set +x
            else
              echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: $deploymentconfig: has $RUNNING_PROCESSES running processes, skipping"
            fi
          else
            echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: $deploymentconfig: no running pods"
          fi
        done
      done
    else
      echo "$OPENSHIFT_URL - $PROJECT_NAME: SKIP, does not match Regex: ^$PROJECT_REGEX$"
    fi
    echo "" # new line for prettyness
  done

