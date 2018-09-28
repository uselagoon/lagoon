#!/bin/bash

set -eo pipefail

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

echo "Loading Keycloak Client Secret for Searchguard"

# Load Client Secret for our client from Keycloak
TOKEN=$(curl -f -s -k "$KEYCLOAK_URL/auth/realms/master/protocol/openid-connect/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin" -d 'password=admin' -d 'grant_type=password' -d 'client_id=admin-cli'|python -c 'import sys, json; print json.load(sys.stdin)["access_token"]')
CLIENT_ID=$(curl -f -s -k "$KEYCLOAK_URL/auth/admin/realms/lagoon/clients?clientId=searchguard&viewableOnly=true" -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" |python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')
export SEARCHGUARD_OPENID_CLIENT_SECRET=$(curl -f -s -k "$KEYCLOAK_URL/auth/admin/realms/lagoon/clients/$CLIENT_ID/client-secret" -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" |python -c 'import sys, json; print json.load(sys.stdin)["value"]')

