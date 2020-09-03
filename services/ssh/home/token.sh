#!/bin/bash

API_ADMIN_TOKEN=$1
USER_SSH_KEY=$2

# This variable is replaced by envplate inside docker-entrypoint.
# We need this because during execution time inside the SSH
# connection we don't have access to the container environment
# variables.
# So we replace it during the start of the container.
server=${AUTH_SERVER}


##
## Get ID of user with given SSH key
##
ADMIN_BEARER="Authorization: bearer $API_ADMIN_TOKEN"
ADMIN_GRAPHQL="query GetUserIdBySshKey {
  userBySshKey(sshKey: \"$USER_SSH_KEY\") {
    id
  }
}"
# GraphQL query on single line with \\n for newlines and escaped quotes
ADMIN_QUERY=$(echo $ADMIN_GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
USER_ID=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$ADMIN_BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$ADMIN_QUERY\"}" | jq --raw-output '.data.userBySshKey.id')

CONTENT_TYPE="Content-Type: application/json"
AUTHORIZATION="Authorization: Bearer $API_ADMIN_TOKEN"

# Prepare the post (containing the user id) as a JSON object.
data="{\"userId\": \"$USER_ID\"}"

# Submit the token request as a POST request with the JSON data
# containing the key.
echo $(wget "$server/generate" --header "$CONTENT_TYPE" --header "$AUTHORIZATION" --post-data "$data" -q -O -)
