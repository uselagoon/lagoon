#!/bin/bash

set -o pipefail

function is_keycloak_running {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" $KEYCLOAK_URL/auth/admin/realms)
    if [[ $http_code -eq 401 ]]; then
        return 0
    else
        return 1
    fi
}

until is_keycloak_running; do
    echo Keycloak still not running, waiting 5 seconds
    sleep 5
done

load_client_secret() (
    # Load Client Secret for our client from Keycloak
    echo "  1. Loading token"
    TOKEN=$(set -eo pipefail; curl -f -s -k "$KEYCLOAK_URL/auth/realms/master/protocol/openid-connect/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=$KEYCLOAK_ADMIN_USER" -d "password=$KEYCLOAK_ADMIN_PASSWORD" -d 'grant_type=password' -d 'client_id=admin-cli'|python -c 'import sys, json; print json.load(sys.stdin)["access_token"]')
    [ $? -ne 0 ] && exit 1
    echo "  2. Loading clientid"
    CLIENT_ID=$(set -eo pipefail; curl -f -s -k "$KEYCLOAK_URL/auth/admin/realms/lagoon/clients?clientId=lagoon-searchguard&viewableOnly=true" -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" |python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')
    [ $? -ne 0 ] && exit 1
    echo "  3. Loading client secret"
    export SEARCHGUARD_OPENID_CLIENT_SECRET=$(set -eo pipefail; curl -f -s -k "$KEYCLOAK_URL/auth/admin/realms/lagoon/clients/$CLIENT_ID/client-secret" -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" |python -c 'import sys, json; print json.load(sys.stdin)["value"]')
    echo "  4. Injecting client secret into kibana config"
    ep config/kibana.yml
)

function fail {
  echo $1 >&2
  exit 1
}

function retry {
  local n=1
  local max=5
  local delay=15

  while true; do
    "$@" && break || {
      if [[ $n -lt $max ]]; then
        ((n++))
        echo "Loading Keycloak Client Secret for Searchguard failed. Attempt $n/$max:"
        sleep $delay;
      else
        fail "Loading Keycloak Client Secret for Searchguard has failed after $n attempts."
      fi
    }
  done
}

echo "Loading Keycloak Client Secret for Searchguard..."

retry load_client_secret

echo "Successfully loaded Keycloak Client Secret for Searchguard"