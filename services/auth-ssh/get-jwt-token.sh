#!/bin/bash

key=$1

# this will be replaced by envplate inside docker-entrypoint. We need that as during execution
# time inside the ssh connection we don't have access to the container environment variables.
# So we replace it during the start of the container.
server=${AMAZEEIO_AUTH_HOST}

header="Content-Type: application/json"

case $SSH_ORIGINAL_COMMAND in
  'login')
    # Prepare the post (containing the ssh public key) as a JSON object.
    data="{\"key\": \"$key\"}"

    # Submit the token request as a POST request with the JSON data
    # containing the key.
    echo $(wget "$server/generate" --header "$header" --post-data "$data" --content-on-error -q -O -)

    ;;
  # TODO: Add blacklist stuff
  # 'logout')

  #   # Prepare the post (containing the ssh public key) as a JSON object.
  #   data='{"key": "'$key'"}'

  #   # Submit the token request as a POST request with the JSON data
  #   # containing the key.
  #   echo $(wget $server/logout --header "$header" --post-data "$data" --content-on-error -q -O -)

  #   ;;
  # 'logout '*)

  #   # Take the first argument from the original ssh input.
  #   input=($SSH_ORIGINAL_COMMAND)
  #   token=$INPUT[1]

  #   # Prepare the post (containing the ssh public key) as a JSON object.
  #   data="{\"key\": \"$key\", \"token\": \"$token\"}"

  #   # Submit the token request as a POST request with the JSON data
  #   # containing the key.
  #   echo $(wget $server/logout --header "$header" --post-data "$data" --content-on-error -q -O -)

  #   ;;
  *)
    # We only allow 'login' and 'logout' requests.
    echo 'Permission denied.'
    exit 1

    ;;
esac
