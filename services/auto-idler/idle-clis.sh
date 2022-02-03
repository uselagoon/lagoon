#!/bin/bash

# set -e -o pipefail

if [ "${LAGOON_ENVIRONMENT_TYPE}" == "production" ]; then

prefixwith() {
  local prefix="$1"
  shift
  "$@" > >(sed "s#^#${prefix}: #") 2> >(sed "s#^#${prefix} (err): #" >&2)
}

# Create an JWT Admin Token to talk to the API
API_ADMIN_JWT_TOKEN=$(./create_jwt.py)
BEARER="Authorization: bearer $API_ADMIN_JWT_TOKEN"

# Load all projects and their environments
GRAPHQL='query environments {
  environments:allProjects {
    name
    autoIdle
    openshift {
      consoleUrl
      token
      name
    }
    environments {
      openshiftProjectName
      name
    }
  }
}'
# Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
query=$(echo $GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
ALL_ENVIRONMENTS=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$query\"}")

# All data successfully loaded, now we don't want to fail anymore if a single idle fails
set +eo pipefail

TMP_DATA="$(mktemp)"
echo "$ALL_ENVIRONMENTS" > $TMP_DATA
# loop through the data and run `openshift-services` against each openshift 1by1
echo "$ALL_ENVIRONMENTS" | jq -r -c '.data.environments[] | select((.environments|length)>=1) | .openshift.consoleUrl' | sort | uniq  | while read openshift
do
  if [[ $openshift =~ $OPENSHIFT_REGEX ]]; then
    # run the idler against a particular openshift only  # run the idler against a particular openshift only
    prefixwith $openshift ./openshift-clis.sh $openshift $TMP_DATA &
  fi
done
sleep 5
# clean up the tmp file
rm $TMP_DATA

fi
