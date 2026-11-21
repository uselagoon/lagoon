#!/bin/bash
# helpers for talking to keycloak, sourced by 00-configure-lagoon.sh

ADMIN_API_LOGIN=false
KC_USE_PREVIOUS_SECRET=false
KC_URL=http://localhost:8080/auth
KC_TOKEN=""
KC_TOKEN_TIME=0

# prints the admin-api client secret to use, the previous secret is used until sync_client_secrets has applied the current one
function admin_api_secret {
  if [ "$KC_USE_PREVIOUS_SECRET" == "true" ]; then
    echo "$KEYCLOAK_ADMIN_API_CLIENT_SECRET_PREVIOUS"
  else
    echo "$KEYCLOAK_ADMIN_API_CLIENT_SECRET"
  fi
}

# logs in to kcadm with the master realm admin-api client, falling back to the previous secret if the secret has been rotated
function login_admin_api_client {
  if /opt/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server ${KC_URL} --realm master --client admin-api --secret $(admin_api_secret); then
    ADMIN_API_LOGIN=true
  elif [ "$KC_USE_PREVIOUS_SECRET" != "true" ] && [ -n "$KEYCLOAK_ADMIN_API_CLIENT_SECRET_PREVIOUS" ]; then
    echo "Logging in with the previous admin-api client secret, the current secret will be applied"
    KC_USE_PREVIOUS_SECRET=true
    login_admin_api_client
  else
    return 1
  fi
}

# fetches an admin token for the curl helpers below, preferring the admin-api client service account and falling back to the admin user
# tokens are refreshed when older than 30 seconds, the default master realm access token lifespan is 60 seconds
function kc_refresh_token {
  local now=$(date +%s)
  if [ -n "$KC_TOKEN" ] && [ $((now - KC_TOKEN_TIME)) -lt 30 ]; then
    return 0
  fi
  local response
  if ! response=$(curl -sS --fail -d grant_type=client_credentials -d client_id=admin-api --data-urlencode "client_secret=$(admin_api_secret)" ${KC_URL}/realms/master/protocol/openid-connect/token 2>/dev/null); then
    response=$(curl -sS --fail -d grant_type=password -d client_id=admin-cli --data-urlencode "username=${KEYCLOAK_USER}" --data-urlencode "password=${KEYCLOAK_PASSWORD}" ${KC_URL}/realms/master/protocol/openid-connect/token)
  fi
  KC_TOKEN=$(echo "$response" | jq -r '.access_token')
  KC_TOKEN_TIME=$now
}

# kc_api METHOD PATH [JSON BODY], PATH is relative to the admin api, eg realms/lagoon/clients
function kc_api {
  local method=$1
  local path=$2
  kc_refresh_token
  if [ -n "$3" ]; then
    curl -sS --fail-with-body -X "$method" -H "Authorization: Bearer ${KC_TOKEN}" -H "Content-Type: application/json" -d "$3" "${KC_URL}/admin/${path}"
  else
    curl -sS --fail-with-body -X "$method" -H "Authorization: Bearer ${KC_TOKEN}" "${KC_URL}/admin/${path}"
  fi
}

# kc_client_id REALM CLIENTID, prints the internal id of a client, fails if it does not exist
function kc_client_id {
  local id
  id=$(kc_api GET "realms/$1/clients?clientId=$2" | jq -r '.[0].id // empty')
  if [ -z "$id" ]; then
    echo "Client $2 not found in realm $1" >&2
    return 1
  fi
  echo "$id"
}

# kc_update_client REALM CLIENTID JQ_FILTER [JQ ARGS...], reads the client, applies the jq filter and writes it back
function kc_update_client {
  local realm=$1
  local client=$2
  local filter=$3
  shift 3
  # refresh in this shell so the token is cached, the lookups below run in subshells
  kc_refresh_token
  local id=$(kc_client_id "$realm" "$client")
  local updated=$(kc_api GET "realms/$realm/clients/$id" | jq -c "$@" "$filter")
  kc_api PUT "realms/$realm/clients/$id" "$updated" > /dev/null
}
