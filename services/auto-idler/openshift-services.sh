#!/bin/bash

DEVELOPMENT_ENVIRONMENTS=$(cat $2)
# Filter only projects that actually have an environment
# Loop through each found project
echo "$DEVELOPMENT_ENVIRONMENTS" | jq -c '.data.developmentEnvironments[] | select((.environments|length)>=1)' | while read project
  do
    PROJECT_NAME=$(echo "$project" | jq -r '.name')
    OPENSHIFT_URL=$(echo "$project" | jq -r '.openshift.consoleUrl')
    AUTOIDLE=$(echo "$project" | jq -r '.autoIdle')

    # check if the openshifturl for the environment matches the openshift we want to run the idler against
    if [ "$1" == "${OPENSHIFT_URL}" ]; then
      # Match the Project name to the Project Regex
      if [[ $PROJECT_NAME =~ $PROJECT_REGEX ]]; then
        OPENSHIFT_TOKEN=$(echo "$project" | jq -r '.openshift.token')
        echo "$PROJECT_NAME: Found with development environments"

        if [[ $AUTOIDLE == "1" ]]; then
          # loop through each environment of the current project
          echo "$project" | jq -c '.environments[]' | while read environment
          do
            ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshiftProjectName')
            ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
            ENVIRONMENT_AUTOIDLE=$(echo "$environment" | jq -r '.autoIdle')
            echo "$PROJECT_NAME: handling development environment $ENVIRONMENT_NAME"

            if [ "$ENVIRONMENT_AUTOIDLE" == "0" ]; then
              echo "$PROJECT_NAME: $ENVIRONMENT_NAME idling disabled, skipping"
              continue
            fi

            # if we need to force idling of development environments we can use flag force `./idle-services.sh force` to skip all checks and proceed to idling
            IDLE_PODS=false # set the variable to false initially, to prevent any false idling
            if [ "$3" == "force" ]; then
              echo "force idling"
              IDLE_PODS=true
            else
              # else we just do normal idling checks
              NO_BUILDS=false
              PODS_RUNNING=false

              # Check for any running builds
              RUNNING_BUILDS=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get --no-headers=true builds | grep "Running" | wc -l | tr -d ' ')
              if [ ! $? -eq 0 ]; then
                echo "$PROJECT_NAME: $ENVIRONMENT_NAME: error checking build status"
                continue
              elif [ "$RUNNING_BUILDS" == "0" ]; then
                # Now we can scale
                echo "$PROJECT_NAME: $ENVIRONMENT_NAME: no running builds"
                NO_BUILDS=true
              else
                echo "$PROJECT_NAME: $ENVIRONMENT_NAME: has $RUNNING_BUILDS running builds, skipping"
                continue
              fi

              # check if any deploymentconfigs have any running pods, and if those pods have been running greater than the $POD_RUN_INTERVAL in seconds (4hrs = 14400seconds) since the current time
              DEPLOYMENTCONFIGS=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get dc -o name -l "service notin (mariadb,postgres,cli)" | sed 's/deploymentconfig.*\///')
              for deployment in $DEPLOYMENTCONFIGS
              do
                RUNNING_PODS=$(oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" get pods -l deploymentconfig=${deployment} --show-labels=false -o json | jq -r '.items | .[] | .status.containerStatuses | .[] | .state.running.startedAt')
                if [[ "$RUNNING_PODS" != "0" && "$RUNNING_PODS" != "" ]]; then
                  for pod in $RUNNING_PODS
                  do
                    FIX_TIME=$(echo $pod | sed 's/T/ /g; s/Z//g') #busybox `date` doesn't like ISO 8601 passed to it, we have to strip the T and Z from it
                    RUNTIME="$(($(date -u +%s)-$(date -u -d "$FIX_TIME" +%s)))" #get a rough runtime from the pod running time
                    if [[ $RUNTIME -gt $POD_RUN_INTERVAL ]]; then
                      echo "$PROJECT_NAME: $ENVIRONMENT_NAME - $deployment running longer than interval, proceeding to check router-logs"
                      PODS_RUNNING=true
                    fi
                  done
                  if [ "$PODS_RUNNING" == false ]; then
                    echo "$PROJECT_NAME: $ENVIRONMENT_NAME - $deployment running less than interval, skipping"
                  fi
                else
                  echo "$PROJECT_NAME: $ENVIRONMENT_NAME - $deployment no running pods, skipping"
                fi
              done

              # if no running builds, and any deploymentconfigs notin (mariadb,postgres,cli) have been running greater than $POD_RUN_INTERVAL, then we want to check router-logs then proceed to idle
              if [[ "$NO_BUILDS" == "true" && "$PODS_RUNNING" == "true" ]]; then
                # Check if this environment has hits
                HITS=$(curl -s -u "admin:$LOGSDB_ADMIN_PASSWORD" -XGET "$ELASTICSEARCH_URL/router-logs-$ENVIRONMENT_OPENSHIFT_PROJECTNAME-*/_search" -H 'Content-Type: application/json' -d"
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
                }" | jq ".hits.total.value")

                if [ ! $? -eq 0 ]; then
                  echo "$PROJECT_NAME: $ENVIRONMENT_NAME error checking hits"
                  IDLE_PODS=false
                  # continue
                elif [ "$HITS" == "null"  ]; then
                  echo "$PROJECT_NAME: $ENVIRONMENT_NAME no data found, skipping"
                  IDLE_PODS=true
                  # continue
                elif [ "$HITS" -gt "0" ]; then
                  echo "$PROJECT_NAME: $ENVIRONMENT_NAME had $HITS hits in last four hours, no idling"
                  IDLE_PODS=false
                  # continue
                else
                  echo "$PROJECT_NAME: $ENVIRONMENT_NAME had no hits in last four hours, starting to idle"
                  IDLE_PODS=true
                  # continue
                fi
              fi
            fi

            # if we have the idlepods variable as true, then we idle pods
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
            echo "$PROJECT_NAME: has autoidle set to $AUTOIDLE "
        fi
      else
        echo "$PROJECT_NAME: SKIP, does not match Regex: $PROJECT_REGEX"
      fi
      # echo "" # new line for prettyness
    fi
  done
