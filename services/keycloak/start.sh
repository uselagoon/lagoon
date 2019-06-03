#!/bin/bash

set -eo pipefail

# 1. The first part of this entrypoint script deals with adding realms and users. Code is a modified version of this entrypoint script:
# https://github.com/stefanjacobs/keycloak_min/blob/f26927426e60c1ec29fc0c0980e5a694a45dcc05/run.sh

function is_keycloak_running {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/auth/admin/realms)
    if [[ $http_code -eq 401 ]]; then
        return 0
    else
        return 1
    fi
}

function configure_lagoon_realm {
    if /opt/jboss/keycloak/bin/kcadm.sh get realms/$KEYCLOAK_REALM --config $CONFIG_PATH > /dev/null; then
        echo "Realm $KEYCLOAK_REALM is already created, skipping initial setup"
        return 0
    fi

    if [ $KEYCLOAK_REALM ]; then
        echo Creating realm $KEYCLOAK_REALM
        /opt/jboss/keycloak/bin/kcadm.sh create realms --config $CONFIG_PATH -s realm=$KEYCLOAK_REALM -s enabled=true
    fi

    if [ "$KEYCLOAK_REALM_ROLES" ]; then
        for role in ${KEYCLOAK_REALM_ROLES//,/ }; do
            echo Creating role $role
            /opt/jboss/keycloak/bin/kcadm.sh create roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=${role}
        done
    fi

    # Configure keycloak for searchguard
    echo Creating client searchguard
    echo '{"clientId": "searchguard", "webOrigins": ["*"], "redirectUris": ["*"]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating mapper for searchguard "groups"
    CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=searchguard --config $CONFIG_PATH | python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')
    echo '{"protocol":"openid-connect","config":{"full.path":"false","id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","claim.name":"groups"},"name":"groups","protocolMapper":"oidc-group-membership-mapper"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -

    # Configure keycloak for ui
    echo Creating client lagoon-ui
    echo '{"clientId": "lagoon-ui", "publicClient": true, "webOrigins": ["*"], "redirectUris": ["*"]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating mapper for lagoon-ui "lagoon-uid"
    CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-ui --config $CONFIG_PATH | python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')
    echo '{"protocol":"openid-connect","config":{"id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","user.attribute":"lagoon-uid","claim.name":"lagoon.user_id","jsonType.label":"int","multivalued":""},"name":"Lagoon User ID","protocolMapper":"oidc-usermodel-attribute-mapper"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -

    if [ "$KEYCLOAK_REALM_SETTINGS" ]; then
        echo Applying extra Realm settings
        echo $KEYCLOAK_REALM_SETTINGS | /opt/jboss/keycloak/bin/kcadm.sh update realms/${KEYCLOAK_REALM:-master} --config $CONFIG_PATH -f -
    fi

    if [ $KEYCLOAK_LAGOON_ADMIN_USERNAME ]; then
        echo Creating user $KEYCLOAK_LAGOON_ADMIN_USERNAME
        # grep would have been nice instead of the double sed, but we don't have gnu grep available, only the busybox grep which is very limited
        local user_id=$(echo '{"username": "'$KEYCLOAK_LAGOON_ADMIN_USERNAME'", "enabled": true}' \
        | /opt/jboss/keycloak/bin/kcadm.sh create users --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f - 2>&1  | sed -e 's/Created new user with id //g' -e "s/'//g")
        echo "Created user with id ${user_id}"
        /opt/jboss/keycloak/bin/kcadm.sh update users/${user_id}/reset-password --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s type=password -s value=${KEYCLOAK_LAGOON_ADMIN_PASSWORD} -s temporary=false -n
        echo "Set password for user ${user_id}"

        /opt/jboss/keycloak/bin/kcadm.sh add-roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} --uid ${user_id} --rolename admin
        echo "Gave user '$KEYCLOAK_LAGOON_ADMIN_USERNAME' the role 'admin'"

        local group_name="lagoonadmin"
        local group_id=$(/opt/jboss/keycloak/bin/kcadm.sh create groups --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=${group_name} 2>&1 | sed -e 's/Created new group with id //g' -e "s/'//g")
        /opt/jboss/keycloak/bin/kcadm.sh update users/${user_id}/groups/${group_id} --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}
        echo "Created group '$group_name' and made user '$KEYCLOAK_LAGOON_ADMIN_USERNAME' member of it"
    fi
}

function configure_api_client {
    api_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH)
    if [ "$api_client_id" != "[ ]" ]; then
        echo "Client api is already created, skipping basic setup"
        return 0
    fi

    # Setup composite roles. Each role will include the roles to the left of it
    composite_role_names=(guest reporter developer maintainer owner)
    composites_add=()
    for crn_key in ${!composite_role_names[@]}; do
        echo Creating role ${composite_role_names[$crn_key]}
        /opt/jboss/keycloak/bin/kcadm.sh create roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s composite=true -s name=${composite_role_names[$crn_key]}

        for ca_key in ${!composites_add[@]}; do
            /opt/jboss/keycloak/bin/kcadm.sh add-roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} --rname ${composite_role_names[$crn_key]} --rolename ${composites_add[$ca_key]}
        done

        composites_add+=(${composite_role_names[$crn_key]})
    done

    # Configure keycloak for api
    echo Creating client api
    echo '{"clientId": "api", "publicClient": false, "standardFlowEnabled": false, "serviceAccountsEnabled": true, "authorizationServicesEnabled": true}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=api --config $CONFIG_PATH | python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')
    ADMIN_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/admin --config $CONFIG_PATH | python -c 'import sys, json; print json.load(sys.stdin)["id"]')

    # Authorization policies
    echo Creating api authz policies
    echo '{"type":"role","logic":"POSITIVE","decisionStrategy":"UNANIMOUS","name":"Admin Role Policy","description":"User has admin role","roles":[{"id":"'$ADMIN_ROLE_ID'","required":true}]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/role --config $CONFIG_PATH -r lagoon -f -
    ADMIN_POLICY_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/policy?name=Admin+Role+Policy --config $CONFIG_PATH | python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')

    #Authorization permissions
    echo Creating api authz permissions
    DEFAULT_PERMISSION_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Default+Permission --config $CONFIG_PATH | python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')
    /opt/jboss/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$DEFAULT_PERMISSION_ID --config $CONFIG_PATH
    echo '{"type":"resource","logic":"POSITIVE","decisionStrategy":"UNANIMOUS","name":"Admins Allowed Permission","description":"Admins granted access to all resources/scopes","resourceType":"urn:api:resources:default","policies":["'$ADMIN_POLICY_ID'"]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/resource --config $CONFIG_PATH -r lagoon -f -
}

function configure_keycloak {
    until is_keycloak_running; do
        echo Keycloak still not running, waiting 5 seconds
        sleep 5
    done

    # Set the config file path because $HOME/.keycloak/kcadm.config resolves to /opt/jboss/?/.keycloak/kcadm.config for some reason, causing it to fail
    CONFIG_PATH=/opt/jboss/keycloak/standalone/data/.keycloak/kcadm.config

    echo Keycloak is running, proceeding with configuration

    /opt/jboss/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD --realm master

    configure_lagoon_realm
    configure_api_client

    echo "Config of Keycloak done. Log in via admin user '$KEYCLOAK_ADMIN_USER' and password '$KEYCLOAK_ADMIN_PASSWORD'"
}

/opt/jboss/keycloak/bin/add-user-keycloak.sh --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD
configure_keycloak &

/bin/sh /opt/jboss/tools/databases/change-database.sh mariadb

##################
# Start Keycloak #
##################

exec /opt/jboss/keycloak/bin/standalone.sh -b 0.0.0.0
