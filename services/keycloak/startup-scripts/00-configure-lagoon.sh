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

  if [ "$KEYCLOAK_LAGOON_OPENSEARCH_SYNC_CLIENT_SECRET" ]; then
    LAGOON_OPENSEARCH_SYNC_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get -r "${KEYCLOAK_REALM:-master}" clients?clientId=lagoon-opensearch-sync --config "$CONFIG_PATH" | jq -r '.[0]["id"]')
    /opt/keycloak/bin/kcadm.sh update "clients/$LAGOON_OPENSEARCH_SYNC_CLIENT_ID" -s "secret=$KEYCLOAK_LAGOON_OPENSEARCH_SYNC_CLIENT_SECRET" --config "$CONFIG_PATH" -r "${KEYCLOAK_REALM:-master}"
  fi
}


function import_lagoon_realm {
  # handle importing a realm from a snapshot of a raw install of 2.16.0
    if /opt/keycloak/bin/kcadm.sh get realms/$KEYCLOAK_REALM --config $CONFIG_PATH > /dev/null; then
        echo "Realm $KEYCLOAK_REALM is already created, skipping initial setup"
        return 0
    fi
    echo Importing realm
    /opt/keycloak/bin/kcadm.sh create realms --config $CONFIG_PATH -f /lagoon/seed/lagoon-realm-2.16.0.json
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

function service-api_add_query-groups_permission {
	if /opt/keycloak/bin/kcadm.sh get-roles -r lagoon --uusername service-account-service-api --cclientid realm-management --config /tmp/kcadm.config | jq -e '.[].name|contains("query-groups")' >/dev/null; then
		echo "service-api already has query-groups realm-management role"
	else
		echo "adding service-api query-groups realm-management role"
		/opt/keycloak/bin/kcadm.sh add-roles -r lagoon --uusername service-account-service-api --cclientid realm-management --rolename query-groups --config $CONFIG_PATH
	fi
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

    /opt/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --user $KEYCLOAK_USER --password $KEYCLOAK_PASSWORD --realm master

    # Sets the order of migrations, add new ones at the end.
    import_lagoon_realm
    configure_lagoon_realm
    configure_admin_email
    configure_smtp_settings
    configure_realm_settings
    configure_lagoon_redirect_uris

    check_migrations_version
    migrate_to_custom_group_mapper
    #post 2.18.0+ migrations after this point
    service-api_add_query-groups_permission

    # always run last
    sync_client_secrets

    echo "Config of Keycloak done. Log in via admin user '$KEYCLOAK_USER' and password '$KEYCLOAK_PASSWORD'"

    # signal config complete
    touch /tmp/keycloak-config-complete
}

configure_keycloak &
