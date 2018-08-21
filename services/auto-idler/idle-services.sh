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
    auto_idle
    openshift {
      console_url
      token
      name
    }
    environments(type: DEVELOPMENT) {
      openshift_projectname
      name
    }
  }
}'
# Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
query=$(set -e -o pipefail; echo $GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
DEVELOPMENT_ENVIRONMENTS=$(set -e -o pipefail; curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" api:3000/graphql -d "{\"query\": \"$query\"}")

# Load all hits of all environments of the last hour
ALL_ENVIRONMENT_HITS=$(curl -s -u "admin:$LOGSDB_ADMIN_PASSWORD" -XGET "http://logs-db:9200/router-logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "group_by_openshift_project": {
      "terms": {
        "field": "openshift_project.keyword",
        "size" : 1000000
      }
    }
  },
"query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "now-4h"
          }
        }
      }
    }
  }
}' | jq '.aggregations.group_by_openshift_project.buckets')

# All data successfully loaded, now we don't want to fail anymore if a single idleing fails
set +eo pipefail

# Filter only projects that actually have an environment
# Loop through each found project
echo "$DEVELOPMENT_ENVIRONMENTS" | jq -c '.data.developmentEnvironments[] | select((.environments|length)>=1)' | while read project
  do
    PROJECT_NAME=$(echo "$project" | jq -r '.name')
    OPENSHIFT_URL=$(echo "$project" | jq -r '.openshift.console_url')
    AUTOIDLE=$(echo "$project" | jq -r '.auto_idle')

    # Match the Project name to the Project Regex
    if [[ $PROJECT_NAME =~ $PROJECT_REGEX ]]; then
      OPENSHIFT_TOKEN=$(echo "$project" | jq -r '.openshift.token')
      echo "$OPENSHIFT_URL - $PROJECT_NAME: Found with development environments"

      if [[ $AUTOIDLE == "1" ]]; then
        # loop through each environment of the current project
        echo "$project" | jq -c '.environments[]' | while read environment
        do
          ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshift_projectname')
          ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
          echo "$OPENSHIFT_URL - $PROJECT_NAME: handling development environment $ENVIRONMENT_NAME"

          # Check if this environment has hits
          HAS_HITS=$(echo $ALL_ENVIRONMENT_HITS | jq ".[] | select(.key==\"$ENVIRONMENT_OPENSHIFT_PROJECTNAME\") | .doc_count | if . > 0 then true else false end")

          if [ ! $? -eq 0 ]; then
            echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME error checking hits"
            continue
          elif [ "$HAS_HITS" == "true" ]; then
            HITS=$(echo $ALL_ENVIRONMENT_HITS | jq ".[] | select(.key==\"$ENVIRONMENT_OPENSHIFT_PROJECTNAME\") | .doc_count")
            echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME had $HITS hits in last four hours, no idleing"
          else
            echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME had no hits in last four hours, starting to idle"
            # actually idleing happens here
            oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" idle -l "service notin (mariadb,postgres)"

            ### Faster Unidling:
            ## Instead of depending that each endpoint is unidling their own service (which means it takes a lot of time to unidle multiple services)
            ## This update makes sure that every endpoing is unidling every service that is currently idled, which means the whole system is much much faster unidled.
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
        done
      else
          echo "$OPENSHIFT_URL - $PROJECT_NAME: has autoidle set to $AUTOIDLE "
      fi
    else
      echo "$OPENSHIFT_URL - $PROJECT_NAME: SKIP, does not match Regex: $PROJECT_REGEX"
    fi
    echo "" # new line for prettyness
  done
