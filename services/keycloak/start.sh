#!/bin/bash

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

function configure_keycloak {
    until is_keycloak_running; do
        echo Keycloak still not running, waiting 5 seconds
        sleep 5
    done

    # Set the config file path because $HOME/.keycloak/kcadm.config resolves to /opt/jboss/?/.keycloak/kcadm.config for some reason, causing it to fail
    CONFIG_PATH=/opt/jboss/keycloak/standalone/data/.keycloak/kcadm.config

    echo Keycloak is running, proceeding with configuration

    /opt/jboss/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --user $KEYCLOAK_SUPERADMIN_USER --password $KEYCLOAK_SUPERADMIN_PASSWORD --realm master

    if [ $KEYCLOAK_REALM ]; then
        echo Creating realm $KEYCLOAK_REALM
        /opt/jboss/keycloak/bin/kcadm.sh create realms --config $CONFIG_PATH -s realm=$KEYCLOAK_REALM -s enabled=true
    fi

    if [ "$KEYCLOAK_CLIENT_IDS" ]; then
        for client in ${KEYCLOAK_CLIENT_IDS//,/ }; do
            echo Creating client $client
            echo '{"clientId": "'${client}'", "webOrigins": ["'${KEYCLOAK_CLIENT_WEB_ORIGINS}'"], "redirectUris": ["'${KEYCLOAK_CLIENT_REDIRECT_URIS}'"]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
            CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=${client} --config $CONFIG_PATH | python -c 'import sys, json; print json.load(sys.stdin)[0]["id"]')
            echo '{"protocol":"openid-connect","config":{"full.path":"false","id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","claim.name":"groups"},"name":"groups","protocolMapper":"oidc-group-membership-mapper"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -
        done
    fi

    if [ "$KEYCLOAK_REALM_ROLES" ]; then
        for role in ${KEYCLOAK_REALM_ROLES//,/ }; do
            echo Creating role $role
            /opt/jboss/keycloak/bin/kcadm.sh create roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=${role}
        done
    fi

    if [ "$KEYCLOAK_REALM_SETTINGS" ]; then
        echo Applying extra Realm settings
        echo $KEYCLOAK_REALM_SETTINGS | /opt/jboss/keycloak/bin/kcadm.sh update realms/${KEYCLOAK_REALM:-master} --config $CONFIG_PATH -f -
    fi

    if [ $KEYCLOAK_ADMIN_USERNAME ]; then
        echo Creating user $KEYCLOAK_ADMIN_USERNAME
        # grep would have been nice instead of the double sed, but we don't have gnu grep available, only the busybox grep which is very limited
        local user_id=$(echo '{"username": "'$KEYCLOAK_ADMIN_USERNAME'", "enabled": true}' \
        | /opt/jboss/keycloak/bin/kcadm.sh create users --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f - 2>&1  | sed -e 's/Created new user with id //g' -e "s/'//g")
        echo "Created user with id ${user_id}"
        /opt/jboss/keycloak/bin/kcadm.sh update users/${user_id}/reset-password --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s type=password -s value=${KEYCLOAK_ADMIN_PASSWORD} -s temporary=false -n
        echo "Set password for user ${user_id}"

        local group_id=$(/opt/jboss/keycloak/bin/kcadm.sh create groups --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=admin 2>&1 | sed -e 's/Created new group with id //g' -e "s/'//g")
        /opt/jboss/keycloak/bin/kcadm.sh update users/${user_id}/groups/${group_id} --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}
        echo "Created group 'admin' and made user ${KEYCLOAK_ADMIN_USERNAME} member of it"
    fi

    echo "Initial config of Keycloak done. Log in via superadmin user '$KEYCLOAK_SUPERADMIN_USER' and password '$KEYCLOAK_SUPERADMIN_PASSWORD'"
}

if [ ! -f /opt/jboss/keycloak/standalone/data/docker-container-configuration-done ]; then
    touch /opt/jboss/keycloak/standalone/data/docker-container-configuration-done
    /opt/jboss/keycloak/bin/add-user-keycloak.sh --user $KEYCLOAK_SUPERADMIN_USER --password $KEYCLOAK_SUPERADMIN_PASSWORD
    configure_keycloak &
fi

/bin/sh /opt/jboss/keycloak/bin/change-database.sh mariadb

##################
# Start Keycloak #
##################

exec /opt/jboss/keycloak/bin/standalone.sh -b 0.0.0.0