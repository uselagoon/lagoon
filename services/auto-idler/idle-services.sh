#!/bin/bash

# Create an JWT Admin Token to talk to the API
API_ADMIN_JWT_TOKEN=$(./create_jwt.sh)
BEARER="Authorization: bearer $API_ADMIN_JWT_TOKEN"

# Load all projects and their environments, but only development environments
GRAPHQL='query developmentEnvironments {
  developmentEnvironments:allProjects {
    name
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
ALL_ENVIRONMENT_HITS=$(curl -s -XGET "http://logs-db:9200/router-logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "group_by_openshift_project": {
      "terms": {
        "field": "openshift_project.keyword"
      }
    }
  },
"query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "now-1h"
          }
        }
      }
    }
  }
}' | jq '.aggregations.group_by_openshift_project.buckets')

# Filter only projects that actually have an environment
# Loop through each found project
echo "$DEVELOPMENT_ENVIRONMENTS" | jq -c '.data.developmentEnvironments[] | select((.environments|length)>=1)' | while read project
  do
    PROJECT_NAME=$(echo "$project" | jq -r '.name')
    OPENSHIFT_URL=$(echo "$project" | jq -r '.openshift.console_url')

    # Match the Project name to the Project Regex
    if [[ $PROJECT_NAME =~ ^$PROJECT_REGEX$ ]]; then
      OPENSHIFT_TOKEN=$(echo "$project" | jq -r '.openshift.token')
      echo "$OPENSHIFT_URL - $PROJECT_NAME: Found with development environments"

      # loop through each environment of the current project
      echo "$project" | jq -c '.environments[]' | while read environment
      do
        ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshift_projectname')
        ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
        echo "$OPENSHIFT_URL - $PROJECT_NAME: handling development environment $ENVIRONMENT_NAME"

        # Check if this environment has hits
        HAS_HITS=$(echo $ALL_ENVIRONMENT_HITS | jq ".[] | select(.key==\"$ENVIRONMENT_OPENSHIFT_PROJECTNAME\") | .doc_count | if . > 0 then true else false end")

        if [ "$HAS_HITS" == "true" ]; then
          HITS=$(echo $ALL_ENVIRONMENT_HITS | jq ".[] | select(.key==\"$ENVIRONMENT_OPENSHIFT_PROJECTNAME\") | .doc_count")
          echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME had $HITS hits in last hour, no idleing"
        else
          echo "$OPENSHIFT_URL - $PROJECT_NAME: $ENVIRONMENT_NAME had no hits in last hour, starting to idle"
          set -x
          # actually idleing happens here
          oc --insecure-skip-tls-verify --token="$OPENSHIFT_TOKEN" --server="$OPENSHIFT_URL" -n "$ENVIRONMENT_OPENSHIFT_PROJECTNAME" idle --all
          set +x
        fi
      done
    else
      echo "$OPENSHIFT_URL - $PROJECT_NAME: SKIP, does not match Regex: ^$PROJECT_REGEX$"
    fi
    echo "" # new line for prettyness
  done

