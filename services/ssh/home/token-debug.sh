#!/bin/bash

API_ADMIN_TOKEN=$1
USER_SSH_KEY=$2

echo "USER_SSH_KEY='${USER_SSH_KEY}'"  >> /proc/1/fd/1

# This variable is hardcoded because using envplate would wipe out all the
# other variables we want to debug.
server="http://auth-server:3000"

echo "server='${server}'"  >> /proc/1/fd/1

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

echo "USER_ID='${USER_ID}'"  >> /proc/1/fd/1

CONTENT_TYPE="Content-Type: application/json"
AUTHORIZATION="Authorization: Bearer $API_ADMIN_TOKEN"

# Prepare the post (containing the user id) as a JSON object.
data="{\"userId\": \"$USER_ID\"}"

token=$(wget "$server/generate" --header "$CONTENT_TYPE" --header "$AUTHORIZATION" --post-data "$data" -d -v -O - 2>&1)
echo "token='${token}'" >> /proc/1/fd/1

# Submit the token request as a POST request with the JSON data
# containing the key.
echo $(wget "$server/generate" --header "$CONTENT_TYPE" --header "$AUTHORIZATION" --post-data "$data" -q -O -)
