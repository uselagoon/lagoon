#!/bin/bash

# make sure we stop if we fail
set -eo pipefail

# Create an JWT Admin Token to talk to the API
API_ADMIN_JWT_TOKEN=$(./create_jwt.sh)
BEARER="Authorization: bearer $API_ADMIN_JWT_TOKEN"

# Load all projects and their environments, but only development environments
GRAPHQL='query developmentEnvironments {
  developmentEnvironments:allProjects {
    name
    autoIdle
    openshift {
      consoleUrl
      token
      name
    }
    environments(type: DEVELOPMENT) {
      openshiftProjectName
      name
      autoIdle
    }
  }
}'
# Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
query=$(set -e -o pipefail; echo $GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
DEVELOPMENT_ENVIRONMENTS=$(set -e -o pipefail; curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" api:3000/graphql -d "{\"query\": \"$query\"}")

# All data successfully loaded, now we don't want to fail anymore if a single idle fails
set +eo pipefail

# Filter only projects that actually have an environment
# Loop through each found project
echo "$DEVELOPMENT_ENVIRONMENTS" | jq -c '.data.developmentEnvironments[] | select((.environments|length)>=1)' | while read project
  do
    PROJECT_NAME=$(echo "$project" | jq -r '.name')
    OPENSHIFT_URL=$(echo "$project" | jq -r '.openshift.consoleUrl')
    AUTOIDLE=$(echo "$project" | jq -r '.autoIdle')

    # Match the Project name to the Project Regex
    if [[ $PROJECT_NAME =~ $PROJECT_REGEX ]]; then
      OPENSHIFT_TOKEN=$(echo "$project" | jq -r '.openshift.token')
      echo "$OPENSHIFT_URL - $PROJECT_NAME: Found with development environments"

      if [[ $AUTOIDLE == "1" ]]; then
        # loop through each environment of the current project
        echo "$project" | jq -c '.environments[]' | while read environment
        do
          ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshiftProjectName')
          ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
          ENVIRONMENT_AUTOIDLE=$(echo "$environment" | jq -r '.autoIdle')
          echo "$OPENSHIFT_URL - $PROJECT_NAME: handling development environment $ENVIRONMENT_NAME"

          if [ "$ENVIRONMENT_AUTOIDLE" == "0" ]; then
            echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME idling disabled, skipping"
            continue
          fi

          # if we need to force idling of development environments we can use flag force `./idle-services.sh force` to skip all checks and proceed to idling
          if [ "$1" == "force" ]; then
            echo "force idling"
            IDLE_PODS=true
          else
            # else we just do normal idling checks
            NO_BUILDS=false
            PODS_RUNNING=false

            # Check for any running builds
            RUNNING_BUILDS=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get --no-headers=true builds | grep "Running" | wc -l | tr -d ' ')
            if [ ! $? -eq 0 ]; then
              echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: error checking build status"
              continue
            elif [ "$RUNNING_BUILDS" == "0" ]; then
              # Now we can scale
              echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: no running builds"
              NO_BUILDS=true
            else
              echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME: has $RUNNING_BUILDS running builds, skipping"
              continue
            fi

            # check if any deploymentconfigs have any running pods, and if those pods have been running greater than the $POD_RUN_INTERVAL in seconds (4hrs = 14400seconds) since the current time
            DEPLOYMENTCONFIGS=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get dc -o name -l "service notin (mariadb,postgres,cli)" | sed 's/deploymentconfigs\///')
            for deployment in $DEPLOYMENTCONFIGS
            do
              RUNNING_PODS=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get pods -l deploymentconfig=${deployment} --show-labels=false -o json | jq -r '.items | .[] | .status.containerStatuses | .[] | .state.running.startedAt')
              if [ "$RUNNING_PODS" != "0" ]; then
                for pod in $RUNNING_PODS
                do
                  FIX_TIME=$(echo $pod | sed 's/T/ /g; s/Z//g') #busybox `date` doesn't like ISO 8601 passed to it, we have to strip the T and Z from it
                  RUNTIME="$(($(date -u +%s)-$(date -u -d "$FIX_TIME" +%s)))" #get a rough runtime from the pod running time
                  if [[ $RUNTIME -gt $POD_RUN_INTERVAL ]]; then
                    echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME - $deployment running longer than interval, proceeding to check router-logs"
                    PODS_RUNNING=true
                  fi
                done
                if [ "$PODS_RUNNING" == false ]; then
                  echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME - $deployment running less than interval, skipping"
                fi
              else
                echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME - $deployment no running pods, skipping"
              fi
            done

            # if no running builds, and any deploymentconfigs notin (mariadb,postgres,cli) have been running greater than $POD_RUN_INTERVAL, then we want to check router-logs then proceed to idle
            if [[ "$NO_BUILDS" == "true" && "$PODS_RUNNING" == "true" ]]; then
              # Check if this environment has hits
              HITS=$(curl -s -u "admin:$LOGSDB_ADMIN_PASSWORD" -XGET "http://logs-db:9200/router-logs-$ENVIRONMENT_OPENSHIFT_PROJECTNAME-*/_search" -H 'Content-Type: application/json' -d"
              {
                \"size\": 0,
                \"query\": {
                  \"bool\": {
                    \"filter\": {
                      \"range\": {
                        \"@timestamp\": {
                          \"gte\": \"now-${ROUTER_LOG_INTERVAL}\"
                        }
                      }
                    }
                  }
                }
              }" | jq ".hits.total")

              if [ ! $? -eq 0 ]; then
                echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME error checking hits"
                continue
              elif [ "$HITS" == "null"  ]; then
                echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME no data found, skipping"
                continue
              elif [ "$HITS" -gt 0 ]; then
                echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME had $HITS hits in last four hours, no idling"
              else
                echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME had no hits in last four hours, starting to idle"
                IDLE_PODS=true
              fi
            fi
          fi
          if [ "$IDLE_PODS" == "true" ]; then
            # actually idling happens here
            oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" idle -l "service notin (mariadb,postgres)"

            ### Faster Unidling:
            ## Instead of depending that each endpoint is unidling their own service (which means it takes a lot of time to unidle multiple services)
            ## This update makes sure that every endpoint is unidling every service that is currently idled, which means the whole system is much much faster unidled.
            # load all endpoints which have unidle targets, format it as a space separated
            IDLING_ENDPOINTS=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get endpoints -o json | jq  --raw-output '[ .items[] | select(.metadata.annotations | has("idling.alpha.openshift.io/unidle-targets")) | .metadata.name ] | join(" ")')
            if [[ "${IDLING_ENDPOINTS}" ]]; then
              # Load all unidling targets of all endpoints and generate one bit JSON array from it
              ALL_IDLED_SERVICES_JSON=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get endpoints -o json | jq --raw-output '[ .items[] | select(.metadata.annotations | has("idling.alpha.openshift.io/unidle-targets")) | .metadata.annotations."idling.alpha.openshift.io/unidle-targets" | fromjson | .[] ] | unique_by(.name) | tojson')
              # add this generated JSON array to all endpoints
              if [[ "${ALL_IDLED_SERVICES_JSON}" ]]; then
                oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" annotate --overwrite endpoints $IDLING_ENDPOINTS "idling.alpha.openshift.io/unidle-targets=${ALL_IDLED_SERVICES_JSON}"
              fi
            fi
          fi
        done # environment loop
      else
          echo "$OPENSHIFT_URL - $PROJECT_NAME: has autoidle set to $AUTOIDLE "
      fi
    else
      echo "$OPENSHIFT_URL - $PROJECT_NAME: SKIP, does not match Regex: $PROJECT_REGEX"
    fi
    echo "" # new line for prettyness
  done
