#!/bin/bash

key=$1

# this will be replaced by envplate inside docker-entrypoint. We need that as during execution
# time inside the ssh connection we don't have access to the container environment variables.
# So we replace it during the start of the container.
server=${AUTH_SERVER}

header="Content-Type: application/json"

# Prepare the post (containing the ssh public key) as a JSON object.
data="{\"key\": \"$key\"}"

# Submit the token request as a POST request with the JSON data
# containing the key.
echo $(wget "$server/generate" --header "$header" --post-data "$data" -q -O -)