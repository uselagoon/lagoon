#!/bin/bash

set -eo pipefail

#####################
# Utility Functions #
#####################

function is_keycloak_running {
    curl -s -w "%{http_code}" http://localhost:8080/auth/admin/realms
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/auth/admin/realms)
    if [[ $http_code -eq 401 ]]; then
        return 0
    else
        return 1
    fi
}

# Ensure client secrets always match environment variables
function sync_client_secrets {
  echo Syncing client secrets

  AUTH_SERVER_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r ${KEYCLOAK_REALM:-master} clients?clientId=auth-server --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$AUTH_SERVER_CLIENT_ID -s secret=$KEYCLOAK_AUTH_SERVER_CLIENT_SECRET --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}

  API_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r ${KEYCLOAK_REALM:-master} clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$API_CLIENT_ID -s secret=$KEYCLOAK_API_CLIENT_SECRET --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}

  SERVICE_API_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r ${KEYCLOAK_REALM:-master} clients?clientId=service-api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$SERVICE_API_CLIENT_ID -s secret=$KEYCLOAK_SERVICE_API_CLIENT_SECRET --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}

  LAGOON_UI_OIDC_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r ${KEYCLOAK_REALM:-master} clients?clientId=lagoon-ui-oidc --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$LAGOON_UI_OIDC_CLIENT_ID -s secret=$KEYCLOAK_LAGOON_UI_OIDC_CLIENT_SECRET --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}

  if [ "$KEYCLOAK_LAGOON_OPENSEARCH_SYNC_CLIENT_SECRET" ]; then
    LAGOON_OPENSEARCH_SYNC_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r "${KEYCLOAK_REALM:-master}" clients?clientId=lagoon-opensearch-sync --config "$CONFIG_PATH" | jq -r '.[0]["id"]')
    /opt/keycloak/bin/kcadm.sh update "clients/$LAGOON_OPENSEARCH_SYNC_CLIENT_ID" -s "secret=$KEYCLOAK_LAGOON_OPENSEARCH_SYNC_CLIENT_SECRET" --config "$CONFIG_PATH" -r "${KEYCLOAK_REALM:-master}"
  fi
}


function import_lagoon_realm {
  # handle importing a realm from a snapshot of a raw install
    if /opt/keycloak/bin/kcadm.sh get realms/$KEYCLOAK_REALM --config $CONFIG_PATH > /dev/null; then
        echo "Realm $KEYCLOAK_REALM is already created, skipping initial setup"
        return 0
    fi
    echo Importing realm
    /opt/keycloak/bin/kcadm.sh create realms --config $CONFIG_PATH -f /lagoon/seed/lagoon-realm-base-import.json
    echo realm import complete
}

function configure_lagoon_realm {
    if /opt/keycloak/bin/kcadm.sh get realms/$KEYCLOAK_REALM --config $CONFIG_PATH > /dev/null; then
        echo "Realm $KEYCLOAK_REALM is already created, skipping initial setup"
        return 0
    fi

    if [ $KEYCLOAK_REALM ]; then
        echo Creating realm $KEYCLOAK_REALM
        /opt/keycloak/bin/kcadm.sh create realms --config $CONFIG_PATH -s realm=$KEYCLOAK_REALM -s enabled=true
    fi

    if [ "$KEYCLOAK_REALM_ROLES" ]; then
        for role in ${KEYCLOAK_REALM_ROLES//,/ }; do
            echo Creating role $role
            /opt/keycloak/bin/kcadm.sh create roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=${role}
        done
    fi
    # Configure keycloak for ui
    echo Creating client lagoon-ui
    echo '{"clientId": "lagoon-ui", "publicClient": true, "webOrigins": ["*"], "redirectUris": ["*"]}' | /opt/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating mapper for lagoon-ui "lagoon-uid"
    CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-ui --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo '{"protocol":"openid-connect","config":{"id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","user.attribute":"lagoon-uid","claim.name":"lagoon.user_id","jsonType.label":"int","multivalued":""},"name":"Lagoon User ID","protocolMapper":"oidc-usermodel-attribute-mapper"}' | /opt/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -

    # don't use KEYCLOAK_REALM_SETTINGS, use the 'configure_realm_settings' way to pass values from a file (inject by configmap/volume mount)
    if [ "$KEYCLOAK_REALM_SETTINGS" ]; then
        echo Applying extra Realm settings
        echo $KEYCLOAK_REALM_SETTINGS | /opt/keycloak/bin/kcadm.sh update realms/${KEYCLOAK_REALM:-master} --config $CONFIG_PATH -f -
    fi

    if [ $KEYCLOAK_LAGOON_ADMIN_USERNAME ]; then
        echo Creating user $KEYCLOAK_LAGOON_ADMIN_USERNAME
        # grep would have been nice instead of the double sed, but we don't have gnu grep available, only the busybox grep which is very limited
        local user_id=$(echo '{"username": "'$KEYCLOAK_LAGOON_ADMIN_USERNAME'", "enabled": true}' \
        | /opt/keycloak/bin/kcadm.sh create users --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f - 2>&1  | sed -e 's/Created new user with id //g' -e "s/'//g")
        echo "Created user with id ${user_id}"
        /opt/keycloak/bin/kcadm.sh update users/${user_id}/reset-password --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s type=password -s value=${KEYCLOAK_LAGOON_ADMIN_PASSWORD} -s temporary=false -n
        echo "Set password for user ${user_id}"

        /opt/keycloak/bin/kcadm.sh add-roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} --uid ${user_id} --rolename admin
        echo "Gave user '$KEYCLOAK_LAGOON_ADMIN_USERNAME' the role 'admin'"
    fi
}

function configure_admin_email {
  # Configure the admin user with an email address so that email configuration can be enabled in the lagoon realm
  # this will always update the email address of the admin user if it is defined
  if [ "$KEYCLOAK_ADMIN_EMAIL" != "" ]; then
    echo Configuring admin user email to ${KEYCLOAK_ADMIN_EMAIL}
    ADMIN_USER_ID=$(/opt/keycloak/bin/kcadm.sh get users -r master --config $CONFIG_PATH -q username=admin | jq -r '.[0]|.id')
    /opt/keycloak/bin/kcadm.sh update users/${ADMIN_USER_ID} --config $CONFIG_PATH -s "email=${KEYCLOAK_ADMIN_EMAIL}"
  fi

}

function configure_smtp_settings {
  # this checks if the file containing the json data for email configuration exists
  if [ "$KEYCLOAK_ADMIN_EMAIL" == "" ] && [ -f "/lagoon/keycloak/keycloak-smtp-settings.json" ]; then
    echo "Admin email must be set to configure lagoon realm email server settings"
    return 0
  fi
  if [ -f "/lagoon/keycloak/keycloak-smtp-settings.json" ]; then
    echo Configuring lagoon realm email server settings
    /opt/keycloak/bin/kcadm.sh update realms/lagoon --config $CONFIG_PATH -f /lagoon/keycloak/keycloak-smtp-settings.json
  fi

}

function configure_realm_settings {
  # this checks if the file containing the json data for realm settings exists
  if [ -f "/lagoon/keycloak/keycloak-realm-settings.json" ]; then
    echo Configuring lagoon realm settings
    /opt/keycloak/bin/kcadm.sh update realms/lagoon --config $CONFIG_PATH -f /lagoon/keycloak/keycloak-realm-settings.json
  fi

}

function configure_lagoon_redirect_uris {
  # this will always run, and will always ensure that the redirect uris are up to date
  # changes to redirect uris should be made via the chart/envvars
  # the value of this variable is a comma separated list of redirect uris
  # eg KEYCLOAK_LAGOON_UI_CLIENT_REDIRECT_URIS="http://localhost:8888/redirect1,http://localhost:8888/redirect2"
  #
  if [ "$KEYCLOAK_LAGOON_UI_CLIENT_REDIRECT_URIS" != "" ]; then
    echo "Updating lagoon-ui redirect URIs"
    redirect_uris=$(echo $KEYCLOAK_LAGOON_UI_CLIENT_REDIRECT_URIS | tr "," "\n")
    update_redirect_uri="["
    for addr in $redirect_uris;do
        update_redirect_uri+="\"$addr\","
    done
    update_redirect_uri=$(echo $update_redirect_uri | sed 's/,*$//g')]
    LAGOON_UI_CLIENT_ID=$( /opt/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-ui --config $CONFIG_PATH | jq -r '.[0]["id"]')
     /opt/keycloak/bin/kcadm.sh update clients/${LAGOON_UI_CLIENT_ID} -s redirectUris=$update_redirect_uri --config "$CONFIG_PATH" -r ${KEYCLOAK_REALM:-master}
  fi
}

function configure_admin_api_client {
  # this client is used by the lagoon api to perform actions against keycloak without needing to use the username and password
  # this allows for configuring the username and password of the admin account with 2fa if required
  admin_api_client_id=$(/opt/keycloak/bin/kcadm.sh get -r master clients?clientId=admin-api --config $CONFIG_PATH)
  if [ "$admin_api_client_id" != "[ ]" ]; then
      echo "Client admin-api is already created, skipping basic setup"
      return 0
  fi
  echo Creating client admin-api
  echo '{"clientId": "admin-api", "publicClient": false, "standardFlowEnabled": false, "serviceAccountsEnabled": true, "secret": "'${KEYCLOAK_ADMIN_API_CLIENT_SECRET}'"}' | /opt/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r master -f -
  ADMIN_API_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r master clients?clientId=admin-api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  echo Enable fine grained permissions
  /opt/keycloak/bin/kcadm.sh update clients/$ADMIN_API_CLIENT_ID/management/permissions --config $CONFIG_PATH -r master -s enabled=true

	/opt/keycloak/bin/kcadm.sh add-roles -r master --uusername service-account-admin-api --rolename admin --config $CONFIG_PATH
}

##############
# Migrations #
##############

# This script runs on every keycloak startup and needs to be idempotent. It also
# has to handle both use cases of installing a fresh keycloak (new cluster, CI,
# etc) and updating existing ones (e.g, prod). For those reasons, every
# migration must be designed to run __only once__ per keycloak install. Once a
# function is released, it should be considered "final."
#
# The "standard" update mechanism is to first check if some data exists that
# would've been created by the function, and halting execution if found.

function check_migrations_version {
  CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  view_all_orgs=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Organizations --config $CONFIG_PATH)

  if [ "$view_all_orgs" != "[ ]" ]; then
      # migrations are all good :D
      return 0
  fi

  # migrations are no good :'(
  echo ""
  echo "Keycloak startup has been halted because your migrations are not up to date for the version of Lagoon you're installing."
  echo "The reason you're seeing this is because you've likely upgraded your Lagoon version too far outside of our recommended upgrade process."
  echo "This halt is done to protect your installation until all the migrations are up to date."
  echo ""
  echo "To run all the previous migrations, you will need to manually downgrade the keycloak image in kubernetes."
  echo "Use the following image version, making note of the image version before the change, as this will need to be reverted"
  echo ""
  echo "  uselagoon/keycloak:v2.17.0"
  echo ""
  echo "Once you have downgraded the image, you must wait for keycloak to run through all the migrations and observe the 'Config of Keycloak done' message at the end."
  echo "Only then can you revert the keycloak image version back to existing the image."
  echo ""
  return 1
EOF
}

function migrate_to_custom_group_mapper {
    local opendistro_security_client_id=$( /opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=lagoon-opendistro-security --config $CONFIG_PATH | jq -r '.[0]["id"]')
    local lagoon_opendistro_security_mappers=$( /opt/keycloak/bin/kcadm.sh get -r lagoon clients/$opendistro_security_client_id/protocol-mappers/models --config $CONFIG_PATH)
    local lagoon_opendistro_security_mapper_groups=$(echo $lagoon_opendistro_security_mappers | jq -r '.[] | select(.name=="groups") | .protocolMapper')
    if [ "$lagoon_opendistro_security_mapper_groups" == "lagoon-search-customprotocolmapper" ]; then
        echo "custom mapper already migrated"
        return 0
    fi

    echo Migrating "token mapper for search" to custom token mapper

    ################
    # Update Mapper
    ################

    local old_mapper_id=$(echo $lagoon_opendistro_security_mappers | jq -r '.[] | select(.name=="groups") | .id')
     /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$opendistro_security_client_id/protocol-mappers/models/$old_mapper_id --config $CONFIG_PATH
    echo '{"name":"groups","protocolMapper":"lagoon-search-customprotocolmapper","protocol":"openid-connect","config":{"id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","multivalued":"true","claim.name":"groups","jsonType.label":"String"}}' |  /opt/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$opendistro_security_client_id/protocol-mappers/models --config $CONFIG_PATH -f -

}

function add_notification_view_all {
  local api_client_id=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  local view_all_notifications=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/permission?name=View+All+Notifications --config $CONFIG_PATH)


  if [ "$view_all_notifications" != "[ ]" ]; then
      echo "notification:viewAll already configured"
      return 0
  fi

  echo creating \"View All Notifications\" permissions

  NOTIFICATION_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/resource?name=notification --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$NOTIFICATION_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"add"},{"name":"delete"},{"name":"view"},{"name":"deleteAll"},{"name":"removeAll"},{"name":"update"},{"name":"viewAll"}]'

  /opt/keycloak/bin/kcadm.sh create clients/$api_client_id/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
  {
    "name": "View All Notifications",
    "type": "scope",
    "logic": "POSITIVE",
    "decisionStrategy": "UNANIMOUS",
    "resources": ["notification"],
    "scopes": ["viewAll"],
    "policies": ["[Lagoon] Users role for realm is Platform Owner"]
  }
EOF
}

function service-api_add_query-groups_permission {
	if /opt/keycloak/bin/kcadm.sh get-roles -r lagoon --uusername service-account-service-api --cclientid realm-management --config /tmp/kcadm.config | jq -e '.[].name|contains("query-groups")' >/dev/null; then
		echo "service-api already has query-groups realm-management role"
	else
		echo "adding service-api query-groups realm-management role"
		/opt/keycloak/bin/kcadm.sh add-roles -r lagoon --uusername service-account-service-api --cclientid realm-management --rolename query-groups --config $CONFIG_PATH
	fi
}


function migrate_admin_organization_permissions {
  # The changes here match the changes that are made in the realm import script
  # fresh installs will not need to perform this migration as the changes will already be in the import
  # this will only run on existing installations to get it into a state that matches the realm import
  CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  organization_admin_permission=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Manage+Organization+Notifications --config $CONFIG_PATH)

  if [ "$organization_admin_permission" != "[ ]" ]; then
      echo "organization_admin_permission already configured"
      return 0
  fi

  echo Configuring Organization admin permissions

  echo Delete existing organization management
  manage_organization=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Manage+Organization --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$manage_organization --config $CONFIG_PATH

  echo Creating organization admin js mapper policy
  local p_name1="User is admin of organization"
  local script_name1="[Lagoon] $p_name1"
  local script_type1="script-policies/$(echo $p_name1 | sed -e 's/.*/\L&/' -e 's/ /-/g').js"
  echo '{"name":"'$script_name1'","type":"'$script_type1'"}' | /opt/keycloak/bin/kcadm.sh create -r lagoon clients/$CLIENT_ID/authz/resource-server/policy/$(echo $script_type1 | sed -e 's/\//%2F/') --config $CONFIG_PATH -f -

  echo Delete existing view organization permission
  view_organization=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Organization --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_organization --config $CONFIG_PATH

  echo Create new view organization permission
  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Organization",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["viewProject","viewGroup","viewNotification","view","viewUsers","viewUser"],
  "policies": ["[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is owner of organization","[Lagoon] User is admin of organization","[Lagoon] User is viewer of organization"]}
EOF

  echo Creating permission for organization owner management
  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Owners",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["addOwner","addViewer"],
  "policies": ["[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is owner of organization"]
}
EOF
  echo Creating permission for organization project management
  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Projects",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["addProject","updateProject","deleteProject"],
  "policies": ["[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is owner of organization","[Lagoon] User is admin of organization"]
}
EOF
  echo Creating permission for organization group management
  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Groups",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["addGroup","removeGroup"],
  "policies": ["[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is owner of organization","[Lagoon] User is admin of organization"]
}
EOF
  echo Creating permission for organization notification management
  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Notifications",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["addNotification","updateNotification","removeNotification"],
  "policies": ["[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is owner of organization","[Lagoon] User is admin of organization"]
}
EOF
}

function migrate_remove_harbor_scan_permissions {
  # The changes here match the changes that are made in the realm import script
  # fresh installs will not need to perform this migration as the changes will already be in the import
  # this will only run on existing installations to get it into a state that matches the realm import
  CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  view_harbor_scan_match=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Harbor+Scan+Match --config $CONFIG_PATH)

  if [ "$view_harbor_scan_match" == "[ ]" ]; then
      echo "view_harbor_scan_match already removed"
      return 0
  fi

  echo Removing old harbor permissions

  echo Delete view_harbor_scan_match permission
  view_harbor_scan_match_id=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Harbor+Scan+Match --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_harbor_scan_match_id --config $CONFIG_PATH
  echo Delete add_harbor_scan_match permission
  add_harbor_scan_match_id=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Add+Harbor+Scan+Match --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$add_harbor_scan_match_id --config $CONFIG_PATH
  echo Delete delete_harbor_scan_match permission
  delete_harbor_scan_match_id=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+Harbor+Scan+Match --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_harbor_scan_match_id --config $CONFIG_PATH
}

function remove_deleteall_permissions_scopes {
  # The changes here match the changes that are made in the realm import script
  # fresh installs will not need to perform this migration as the changes will already be in the import
  # this will only run on existing installations to get it into a state that matches the realm import
  CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  delete_all_projects=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Projects --config $CONFIG_PATH)

  if [ "$delete_all_projects" == "[ ]" ]; then
      echo "deleteall permissions already removed"
      return 0
  fi

  NOTIFICATION_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=notification --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$NOTIFICATION_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"add"},{"name":"delete"},{"name":"view"},{"name":"update"},{"name":"viewAll"}]'

  GROUP_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=group --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$GROUP_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"addUser"},{"name":"add"},{"name":"removeUser"},{"name":"update"},{"name":"viewAll"},{"name":"delete"}]'

  BACKUP_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=backup --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$BACKUP_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"add"},{"name":"view"},{"name":"delete"}]'

  SSHKEY_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=ssh_key --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$SSHKEY_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"add"},{"name":"update"},{"name":"view:user"},{"name":"delete"},{"name":"view:project"}]'

  USER_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=user --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$USER_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"add"},{"name":"getBySshKey"},{"name":"update"},{"name":"viewAll"},{"name":"delete"}]'

  ENVIRONMENT_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=environment --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$ENVIRONMENT_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"deploy:production"},{"name":"addOrUpdate:production"},{"name":"viewAll"},{"name":"storage"},{"name":"addOrUpdate:development"},{"name":"update:development"},{"name":"ssh:development"},{"name":"delete:development"},{"name":"view"},{"name":"deploy:development"},{"name":"deleteNoExec"},{"name":"ssh:production"},{"name":"delete:production"},{"name":"update:production"}]'

  ORGANIZATION_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=organization --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$ORGANIZATION_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"updateNotification"},{"name":"addUser"},{"name":"add"},{"name":"removeNotification"},{"name":"viewNotification"},{"name":"addOwner"},{"name":"updateOrganization"},{"name":"update"},{"name":"viewUser"},{"name":"viewAll"},{"name":"updateProject"},{"name":"delete"},{"name":"viewProject"},{"name":"addNotification"},{"name":"viewUsers"},{"name":"view"},{"name":"viewGroup"},{"name":"deleteProject"},{"name":"removeGroup"},{"name":"addViewer"},{"name":"addProject"},{"name":"addGroup"}]'

  OPENSHIFT_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=openshift --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$OPENSHIFT_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"add"},{"name":"view"},{"name":"view:token"},{"name":"update"},{"name":"viewAll"},{"name":"delete"}]'

  echo Delete deleteall sshkeys permission
  delete_all_sshkeys=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+SSH+Keys --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_all_sshkeys --config $CONFIG_PATH

  echo Delete deleteall notifications permission
  delete_all_notifications=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Notifications --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_all_notifications --config $CONFIG_PATH

  echo Delete deleteall groups permission
  delete_all_groups=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Groups --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_all_groups --config $CONFIG_PATH

  echo Delete deleteall users permission
  delete_all_users=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Users --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_all_users --config $CONFIG_PATH

  echo Delete deleteall environments permission
  delete_all_environments=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Environments --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_all_environments --config $CONFIG_PATH

  echo Delete deleteall backups permission
  delete_all_backups=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Backups --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_all_backups --config $CONFIG_PATH

  echo Delete deleteall projects permission
  delete_all_projects=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Projects --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$delete_all_projects --config $CONFIG_PATH

}

function add_update_platform_viewer_permissions {
  # The changes here match the changes that are made in the realm import script
  # fresh installs will not need to perform this migration as the changes will already be in the import
  # this will only run on existing installations to get it into a state that matches the realm import
  CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  organization_admin_permission=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Get+SSH+Keys+for+User --config $CONFIG_PATH | jq -r '.[0]["id"]')
  associated_policies=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/policy/$organization_admin_permission/associatedPolicies --config $CONFIG_PATH | jq -c 'map({name})')

  # check the permission to see if the platform viewer role is already configured
  if [[ "$associated_policies" =~ 'Users role for realm is Platform Viewer' ]]; then
      echo "add_update_platform_viewer_permissions already configured"
      return 0
  fi

  echo Creating platform viewer js mapper policy
  local p_name1="Users role for realm is Platform Viewer"
  local script_name1="[Lagoon] $p_name1"
  local script_type1="script-policies/$(echo $p_name1 | sed -e 's/.*/\L&/' -e 's/ /-/g').js"
  echo '{"name":"'$script_name1'","type":"'$script_type1'"}' | /opt/keycloak/bin/kcadm.sh create -r lagoon clients/$CLIENT_ID/authz/resource-server/policy/$(echo $script_type1 | sed -e 's/\//%2F/') --config $CONFIG_PATH -f -

  echo Create platform viewer role
  /opt/keycloak/bin/kcadm.sh create roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=platform-viewer

  echo Re-configuring ssh_key:view:user
  #Delete existing permissions
  get_user_sshkeys=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Get+SSH+Keys+for+User --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$get_user_sshkeys --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Get SSH Keys for User",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["ssh_key"],
  "scopes": ["view:user"],
  "policies": ["[Lagoon] User has access to own data","[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring organization:views
  #Delete existing permissions
  view_organizations=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Organization --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_organizations --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Organization",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["view","viewProject","viewGroup","viewNotification","viewUser","viewUsers"],
  "policies": ["[Lagoon] User is admin of organization","[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is viewer of organization"]
}
EOF

  echo Re-configuring organization:viewAll
  #Delete existing permissions
  view_all_organizations=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Organizations --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_organizations --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Organizations",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring user:getBySshKey
  #Delete existing permissions
  get_user_by_sshkey=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Get+User+By+SSH+Key --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$get_user_by_sshkey --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Get User By SSH Key",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["user"],
  "scopes": ["getBySshKey"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring environment:viewAll
  #Delete existing permissions
  view_all_environments=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Environments --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_environments --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Environments",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["environment"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring environment:storage
  #Delete existing permissions
  view_all_environment_storage=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Environment+Metrics --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_environment_storage --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Environment Metrics",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["environment"],
  "scopes": ["storage"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring notification:viewAll
  #Delete existing permissions
  view_all_notifications=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Notifications --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_notifications --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Notifications",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["notification"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring group:viewAll
  #Delete existing permissions
  view_all_groups=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Groups --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_groups --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Groups",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["group"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring user:viewAll
  #Delete existing permissions
  view_all_users=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Users --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_users --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Users",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["user"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring openshift:viewAll
  #Delete existing permissions
  view_all_openshifts=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Openshifts --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_openshifts --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Openshifts",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["openshift"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring project:viewAll
  #Delete existing permissions
  view_all_projects=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Projects --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_projects --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Projects",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["project"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF
}

function service-api_add_view-users_permission {
	if /opt/keycloak/bin/kcadm.sh get-roles -r lagoon --uusername service-account-service-api --cclientid realm-management --config /tmp/kcadm.config | jq -e '.[].name|contains("view-users")' >/dev/null; then
		echo "service-api already has view-users realm-management role"
	else
		echo "adding service-api view-users realm-management role"
		/opt/keycloak/bin/kcadm.sh add-roles -r lagoon --uusername service-account-service-api --cclientid realm-management --rolename view-users --config $CONFIG_PATH
	fi
}

function add_lagoon-cli_client {
    local lagoon_cli_client=$( /opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=lagoon-cli --config $CONFIG_PATH | jq -r '.[0]["id"] // false')
    if [ "$lagoon_cli_client" != "false" ]; then
        echo "lagoon-cli already exists"
        return 0
    fi

    echo Creating client lagoon-cli
    echo '{"clientId": "lagoon-cli", "publicClient": true, "webOrigins": ["*"], "redirectUris": ["http://127.0.0.1"]}' | /opt/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating mapper for lagoon-cli "lagoon-uid"
    CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-cli --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo '{"protocol":"openid-connect","config":{"id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","user.attribute":"lagoon-uid","claim.name":"lagoon.user_id","jsonType.label":"int","multivalued":""},"name":"Lagoon User ID","protocolMapper":"oidc-usermodel-attribute-mapper"}' | /opt/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -
}

function add_lagoon-ui-oidc_client {
    local lagoon_ui_oidc_client=$( /opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=lagoon-ui-oidc --config $CONFIG_PATH | jq -r '.[0]["id"] // false')
    if [ "$lagoon_ui_oidc_client" != "false" ]; then
        echo "lagoon-ui-oidc already exists"
        return 0
    fi

    echo Creating client lagoon-ui-oidc
    echo '{"clientId": "lagoon-ui-oidc", "publicClient": false, "webOrigins": ["*"], "redirectUris": ["*"]}' | /opt/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating mapper for lagoon-ui-oidc "lagoon-uid"
    CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-ui-oidc --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo '{"protocol":"openid-connect","config":{"id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","user.attribute":"lagoon-uid","claim.name":"lagoon.user_id","jsonType.label":"int","multivalued":""},"name":"Lagoon User ID","protocolMapper":"oidc-usermodel-attribute-mapper"}' | /opt/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -
}

function add_update_platform_organization_permissions {
  # The changes here match the changes that are made in the realm import script
  # fresh installs will not need to perform this migration as the changes will already be in the import
  # this will only run on existing installations to get it into a state that matches the realm import
  CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  platform_organization_owner_permission=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Organizations --config $CONFIG_PATH | jq -r '.[0]["id"]')
  associated_policies=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/policy/$platform_organization_owner_permission/associatedPolicies --config $CONFIG_PATH | jq -c 'map({name})')

  # check the permission to see if the platform organization owner role is already configured
  if [[ "$associated_policies" =~ 'Users role for realm is Platform Organization Owner' ]]; then
      echo "add_update_platform_organization_permissions already configured"
      return 0
  fi

  echo Creating platform organization owner js mapper policy
  local p_name1="Users role for realm is Platform Organization Owner"
  local script_name1="[Lagoon] $p_name1"
  local script_type1="script-policies/$(echo $p_name1 | sed -e 's/.*/\L&/' -e 's/ /-/g').js"
  echo '{"name":"'$script_name1'","type":"'$script_type1'"}' | /opt/keycloak/bin/kcadm.sh create -r lagoon clients/$CLIENT_ID/authz/resource-server/policy/$(echo $script_type1 | sed -e 's/\//%2F/') --config $CONFIG_PATH -f -

  echo Create platform organization owner role
  /opt/keycloak/bin/kcadm.sh create roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=platform-organization-owner

  echo Re-configuring organization:updateOrganization
  #Delete existing permissions
  update_organization=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Update+Organization --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$update_organization --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Organization",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["updateOrganization"],
  "policies": ["[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring organization:view:viewProject:viewGroup:viewNotification:viewUser:viewUsers
  #Delete existing permissions
  view_organization=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Organization --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_organization --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Organization",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["view","viewProject","viewGroup","viewNotification","viewUser","viewUsers"],
  "policies": ["[Lagoon] User is admin of organization","[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is viewer of organization"]
}
EOF

  echo Re-configuring organization:delete:update:add
  #Delete existing permissions
  manage_organization=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Platform+Owner+Manage+Organizations+and+Owners --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$manage_organization --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Platform Owner Manage Organizations and Owners",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["delete","update","add"],
  "policies": ["[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring organization:addViewer:addOwner
  #Delete existing permissions
  manage_organization_owners=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Manage+Organization+Owners --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$manage_organization_owners --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Owners",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["addViewer","addOwner"],
  "policies": ["[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring organization:addProject:updateProject:deleteProject
  #Delete existing permissions
  manage_organization_projects=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Manage+Organization+Projects --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$manage_organization_projects --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Projects",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["addProject","updateProject","deleteProject"],
  "policies": ["[Lagoon] User is admin of organization","[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring organization:removeGroup:addGroup
  #Delete existing permissions
  manage_organization_groups=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Manage+Organization+Groups --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$manage_organization_groups --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Groups",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["removeGroup","addGroup"],
  "policies": ["[Lagoon] User is admin of organization","[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring organization:addNotification:removeNotification:updateNotification
  #Delete existing permissions
  manage_organization_notifications=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Manage+Organization+Notifications --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$manage_organization_notifications --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Organization Notifications",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["addNotification","removeNotification","updateNotification"],
  "policies": ["[Lagoon] User is admin of organization","[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring openshift:viewAll
  #Delete existing permissions
  view_all_openshifts=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Openshifts --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_openshifts --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Openshifts",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["openshift"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

  echo Re-configuring organization:viewAll
  #Delete existing permissions
  view_all_organizations=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Organizations --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_all_organizations --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Organizations",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["viewAll"],
  "policies": ["[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner"]
}
EOF

}

function lagoon-opensearch-sync_add_view-users_permission {
	if /opt/keycloak/bin/kcadm.sh get-roles -r lagoon --uusername service-account-lagoon-opensearch-sync --cclientid realm-management --config /tmp/kcadm.config | jq -e '.[].name|contains("view-users")' >/dev/null; then
		echo "lagoon-opensearch-sync already has view-users realm-management role"
	else
		echo "adding lagoon-opensearch-sync view-users realm-management role"
		/opt/keycloak/bin/kcadm.sh add-roles -r lagoon --uusername service-account-lagoon-opensearch-sync --cclientid realm-management --rolename view-users --config $CONFIG_PATH
	fi
}

function add_org_env_vars {
  local api_client_id=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  local manage_org_env_var=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/permission?name=Manage+Organization+Environmnet+Variables --config $CONFIG_PATH)


  if [ "$manage_org_env_var" != "[ ]" ]; then
      echo "Organization env vars already configured"
      return 0
  fi

  echo adding permissions for organization env vars

  # Add scopes to organization resource
  ORGANIZATION_RESOURCE_ID=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=organization --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$ORGANIZATION_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"updateNotification"},{"name":"addUser"},{"name":"add"},{"name":"removeNotification"},{"name":"viewNotification"},{"name":"addOwner"},{"name":"updateOrganization"},{"name":"update"},{"name":"viewUser"},{"name":"viewAll"},{"name":"updateProject"},{"name":"delete"},{"name":"viewProject"},{"name":"addNotification"},{"name":"viewUsers"},{"name":"view"},{"name":"viewGroup"},{"name":"deleteProject"},{"name":"removeGroup"},{"name":"addViewer"},{"name":"addProject"},{"name":"addGroup"},{"name":"addEnvVar"},{"name":"deleteEnvVar"},{"name":"viewEnvVar"}]'

  # Create "Manage Organization Environmnet Variables" permission
  /opt/keycloak/bin/kcadm.sh create clients/$api_client_id/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
  {
    "name": "Manage Organization Environmnet Variables",
    "type": "scope",
    "logic": "POSITIVE",
    "decisionStrategy": "AFFIRMATIVE",
    "resources": ["organization"],
    "scopes": ["addEnvVar","deleteEnvVar","viewEnvVar"],
    "policies": ["[Lagoon] User is admin of organization","[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Owner"]
  }
EOF

  # Add viewEnvVar scope to "View Organization" permission
  view_organization=$(/opt/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Organization --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$view_organization --config $CONFIG_PATH

  /opt/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Organization",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["organization"],
  "scopes": ["view","viewProject","viewGroup","viewNotification","viewUser","viewUsers","viewEnvVar"],
  "policies": ["[Lagoon] User is admin of organization","[Lagoon] User is owner of organization","[Lagoon] Users role for realm is Platform Organization Owner","[Lagoon] Users role for realm is Platform Viewer","[Lagoon] Users role for realm is Platform Owner","[Lagoon] User is viewer of organization"]
}
EOF
}

##################
# Initialization #
##################

function configure_keycloak {
    until is_keycloak_running; do
        echo Keycloak still not running, waiting 5 seconds
        sleep 5
    done

    CONFIG_PATH=/tmp/kcadm.config

    echo Keycloak is running, proceeding with configuration

    # attempt to log in with the admin-api client service account
    # this can fail the first time as the admin-api client might not exist because it is called by 'configure_admin_api_client'
    # it will then fall back to using the username and password to authenticate against keycloak
    # this has the same downside as the username/password problem in that if the user password or the admin-api client secret are ever rotated
    # then they will need to be changed in keycloak at the same time that the changes are applied when rotating them via lagoon if they are being changed
    # otherwise there is currently no way to change these without knowing the previous password or client secret
    if ! /opt/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --realm master --client admin-api --secret ${KEYCLOAK_ADMIN_API_CLIENT_SECRET}
    then
      if ! /opt/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --user $KEYCLOAK_USER --password $KEYCLOAK_PASSWORD --realm master
      then
        echo "Unable to log in to keycloak with client admin-api or keycloak admin username and password"
        echo "If you have rotated the admin-api secret, you will need to log in and update it manually"
        exit 1
      fi
    fi

    # Sets the order of migrations, add new ones at the end.
    import_lagoon_realm
    configure_lagoon_realm
    configure_admin_email
    configure_smtp_settings
    configure_realm_settings
    configure_lagoon_redirect_uris
    configure_admin_api_client

    check_migrations_version
    migrate_to_custom_group_mapper
    #post 2.18.0+ migrations after this point
    service-api_add_query-groups_permission
    add_notification_view_all
    migrate_admin_organization_permissions
    migrate_remove_harbor_scan_permissions
    remove_deleteall_permissions_scopes
    add_update_platform_viewer_permissions
    service-api_add_view-users_permission
    add_lagoon-cli_client
    add_lagoon-ui-oidc_client
    add_update_platform_organization_permissions
    lagoon-opensearch-sync_add_view-users_permission
    add_org_env_vars

    # always run last
    sync_client_secrets

    echo "Config of Keycloak done. Log in via admin user '$KEYCLOAK_USER' and password '$KEYCLOAK_PASSWORD'"

    # signal config complete
    touch /tmp/keycloak-config-complete
}

configure_keycloak &
