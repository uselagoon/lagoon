#!/bin/bash

send_graphql_query() {
  data=$(echo "mutation addKeyToUser {
    addUserSSHPublicKey(input: {
      name: \"${1}\"
      publicKey: \"${2}\"
      user: {
        email: \"${1}@example.com\"
      }
    }) {
      id
      name
    }
  }" | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $$0} else {printf "\\n"$$0}}')
  json="{\"query\": \"$data\"}"
  curl -ksS -XPOST -H 'Content-Type: application/json' -H "Authorization: bearer ${LAGOON_LEGACY_ADMIN}" "${LAGOON_API_HOST}" -d "$json"
}

LAGOON_SEED_USERS=("guest" "reporter" "developer" "maintainer" "owner" "orguser" "orgviewer" "orgadmin" "orgowner" "platformorgowner" "platformviewer" "platformowner")

for i in ${LAGOON_SEED_USERS[@]}
do
  echo "Configuring ssh-key for $i@example.com"
  key=$(cat local-dev/user-keys/$i.pub | awk '{print $1" "$2}')
  send_graphql_query $i "$key"
done