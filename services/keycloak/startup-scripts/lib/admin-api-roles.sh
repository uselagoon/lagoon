#!/bin/bash
# roles for the master realm admin-api client, sourced by 00-configure-lagoon.sh

# the lagoon-realm and master-realm clients in the master realm have no realm-admin composite, only the individual management roles
ADMIN_API_LAGOON_REALM_ROLES=(view-realm manage-realm view-users manage-users query-users query-groups query-clients query-realms view-clients manage-clients create-client view-identity-providers manage-identity-providers view-authorization manage-authorization view-events manage-events)
# master-realm is needed to update the master admin user (eg its email address) and to sync its own client secret
ADMIN_API_MASTER_REALM_ROLES=(view-users query-users manage-users view-clients query-clients manage-clients)

# has_all_roles EXISTING_ROLES ROLE..., true if every role is in the newline separated list of existing roles
function has_all_roles {
  local existing=$1
  shift
  local role
  for role in "$@"; do
    echo "$existing" | grep -qx "$role" || return 1
  done
}

# add_admin_api_roles CLIENT ROLE..., grants client roles from the master realm CLIENT to the admin-api service account
function add_admin_api_roles {
  local client=$1
  shift
  local role_args=()
  local role
  for role in "$@"; do
    role_args+=(--rolename "$role")
  done
  /opt/keycloak/bin/kcadm.sh add-roles -r master --uusername service-account-admin-api --cclientid $client "${role_args[@]}" --config $CONFIG_PATH
}

function configure_admin_api_client_roles {
  local master_roles
  local lagoon_realm_roles
  local master_realm_roles
  # once scoped the service account can no longer read its own role mappings, a failure here means it is already set up
  if ! master_roles=$(/opt/keycloak/bin/kcadm.sh get-roles -r master --uusername service-account-admin-api --config $CONFIG_PATH | jq -r '.[].name') ||
     ! lagoon_realm_roles=$(/opt/keycloak/bin/kcadm.sh get-roles -r master --uusername service-account-admin-api --cclientid lagoon-realm --config $CONFIG_PATH | jq -r '.[].name') ||
     ! master_realm_roles=$(/opt/keycloak/bin/kcadm.sh get-roles -r master --uusername service-account-admin-api --cclientid master-realm --config $CONFIG_PATH | jq -r '.[].name'); then
    echo "Unable to read admin-api service account roles in the master realm, assuming already scoped, skipping"
    return 0
  fi

  local has_admin=false
  local has_create_realm=false
  echo "$master_roles" | grep -qx admin && has_admin=true
  echo "$master_roles" | grep -qx create-realm && has_create_realm=true

  if [ "$has_admin" == "false" ] && [ "$has_create_realm" == "false" ] \
    && has_all_roles "$lagoon_realm_roles" "${ADMIN_API_LAGOON_REALM_ROLES[@]}" \
    && has_all_roles "$master_realm_roles" "${ADMIN_API_MASTER_REALM_ROLES[@]}"; then
    echo "Service account for admin-api in the master realm is already scoped, skipping"
    return 0
  fi

  echo Granting admin-api in the master realm the roles to manage the lagoon realm and the master realm users and clients
  add_admin_api_roles lagoon-realm "${ADMIN_API_LAGOON_REALM_ROLES[@]}"
  add_admin_api_roles master-realm "${ADMIN_API_MASTER_REALM_ROLES[@]}"

  # the broad roles are removed only after the scoped roles have been granted
  if [ "$has_admin" == "true" ]; then
    echo Removing the master realm admin role from admin-api
    /opt/keycloak/bin/kcadm.sh remove-roles -r master --uusername service-account-admin-api --rolename admin --config $CONFIG_PATH
  fi
  if [ "$has_create_realm" == "true" ]; then
    echo Removing the master realm create-realm role from admin-api
    /opt/keycloak/bin/kcadm.sh remove-roles -r master --uusername service-account-admin-api --rolename create-realm --config $CONFIG_PATH
  fi

  # tokens already issued do not include newly granted roles, so log in again with the admin-api client
  login_admin_api_client
  KC_TOKEN=""
}
