#!/bin/bash

set -eo pipefail

#####################
# Utility Functions #
#####################

function is_keycloak_running {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://$(hostname -i):8080/auth/admin/realms)
    if [[ $http_code -eq 401 ]]; then
        return 0
    else
        return 1
    fi
}

# Ensure client secrets always match environment variables
function sync_client_secrets {
  echo Syncing client secrets

  AUTH_SERVER_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r ${KEYCLOAK_REALM:-master} clients?clientId=auth-server --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$AUTH_SERVER_CLIENT_ID -s secret=$KEYCLOAK_AUTH_SERVER_CLIENT_SECRET --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}

  API_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r ${KEYCLOAK_REALM:-master} clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$API_CLIENT_ID -s secret=$KEYCLOAK_API_CLIENT_SECRET --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}

  SERVICE_API_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r ${KEYCLOAK_REALM:-master} clients?clientId=service-api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$SERVICE_API_CLIENT_ID -s secret=$KEYCLOAK_SERVICE_API_CLIENT_SECRET --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}

  if [ "$KEYCLOAK_LAGOON_OPENSEARCH_SYNC_CLIENT_SECRET" ]; then
    LAGOON_OPENSEARCH_SYNC_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r "${KEYCLOAK_REALM:-master}" clients?clientId=lagoon-opensearch-sync --config "$CONFIG_PATH" | jq -r '.[0]["id"]')
    /opt/jboss/keycloak/bin/kcadm.sh update "clients/$LAGOON_OPENSEARCH_SYNC_CLIENT_ID" -s "secret=$KEYCLOAK_LAGOON_OPENSEARCH_SYNC_CLIENT_SECRET" --config "$CONFIG_PATH" -r "${KEYCLOAK_REALM:-master}"
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
    # Configure keycloak for ui
    echo Creating client lagoon-ui
    echo '{"clientId": "lagoon-ui", "publicClient": true, "webOrigins": ["*"], "redirectUris": ["*"]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating mapper for lagoon-ui "lagoon-uid"
    CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-ui --config $CONFIG_PATH | jq -r '.[0]["id"]')
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

function configure_opendistro_security_client {

    # delete old SearchGuard Clients
    searchguard_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=searchguard --config $CONFIG_PATH)
    if [ "$searchguard_client_id" != "[ ]" ]; then
        echo "Client searchguard is exising, will delete"
        SEARCHGUARD_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=searchguard --config $CONFIG_PATH | jq -r '.[0]["id"]')
        /opt/jboss/keycloak/bin/kcadm.sh delete clients/${SEARCHGUARD_CLIENT_ID} --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}
    fi
    lagoon_searchguard_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=lagoon-searchguard --config $CONFIG_PATH)
    if [ "$lagoon_searchguard_client_id" != "[ ]" ]; then
        echo "Client lagoon-searchguard is exising, will delete"
        LAGOON_SEARCHGUARD_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-searchguard --config $CONFIG_PATH | jq -r '.[0]["id"]')
        /opt/jboss/keycloak/bin/kcadm.sh delete clients/${LAGOON_SEARCHGUARD_CLIENT_ID} --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master}
    fi


    opendistro_security_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=lagoon-opendistro-security --config $CONFIG_PATH)
    if [ "$opendistro_security_client_id" != "[ ]" ]; then
        echo "Client lagoon-opendistro-security is already created, skipping setup"
        return 0
    fi

    # Configure keycloak for lagoon-opendistro-security
    echo Creating client lagoon-opendistro-security
    local SECRET=$(openssl rand -hex 16)
    echo '{"clientId": "lagoon-opendistro-security", "webOrigins": ["*"], "redirectUris": ["*"], "secret": "'$SECRET'"}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating mapper for lagoon-opendistro-security "groups"
    CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=lagoon-opendistro-security --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo '{"protocol":"openid-connect","config":{"script":"var ArrayList = Java.type(\"java.util.ArrayList\");\nvar groupsAndRoles = new ArrayList();\nvar forEach = Array.prototype.forEach;\n\n\/\/ add all groups the user is part of\nforEach.call(user.getGroups().toArray(), function(group) {\n  \/\/ remove the group role suffixes\n  \/\/lets check if the group has a parent if this is a child\n  if(group.getFirstAttribute(\"type\") == \"role-subgroup\") {\n    var parent = group.getParent();\n    if(parent.getFirstAttribute(\"type\") == \"project-default-group\") {\n        var projectIds = parent.getFirstAttribute(\"lagoon-projects\");\n        if(projectIds !== null) {\n            forEach.call(projectIds.split(\",\"), function(g) {\n              groupsAndRoles.add(\"p\" + g);  \n            });\n            return;\n        }\n    }\n  }\n \n  var groupName = group.getName().replace(\/-owner|-maintainer|-developer|-reporter|-guest\/gi,\"\");\n  groupsAndRoles.add(groupName);\n  return;\n});\n\n\/\/ add all roles the user is part of\nforEach.call(user.getRoleMappings().toArray(), function(role) {\n   var roleName = role.getName();\n   groupsAndRoles.add(roleName);\n});\n\nexports = groupsAndRoles;","id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","multivalued":"true","claim.name":"groups","jsonType.label":"String"},"name":"groups","protocolMapper":"oidc-script-based-protocol-mapper"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -

}

function configure_api_client {
    api_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH)
    if [ "$api_client_id" != "[ ]" ]; then
        echo "Client api is already created, skipping basic setup"
        return 0
    fi

    # Enable username edit
    /opt/jboss/keycloak/bin/kcadm.sh update realms/${KEYCLOAK_REALM:-master} --config $CONFIG_PATH -s editUsernameAllowed=true

    echo Creating client auth-server
    echo '{"clientId": "auth-server", "publicClient": false, "standardFlowEnabled": false, "serviceAccountsEnabled": true, "secret": "'$KEYCLOAK_AUTH_SERVER_CLIENT_SECRET'"}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    AUTH_SERVER_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=auth-server --config $CONFIG_PATH | jq -r '.[0]["id"]')
    REALM_MANAGEMENT_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=realm-management --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo Enable auth-server token exchange
    # 1 Enable fine grained admin permissions for users
    /opt/jboss/keycloak/bin/kcadm.sh update users-management-permissions --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s enabled=true
    # 2 Enable fine grained admin perions for client
    /opt/jboss/keycloak/bin/kcadm.sh update clients/$AUTH_SERVER_CLIENT_ID/management/permissions --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s enabled=true
    # 3 Create policy for auth-server client
    echo '{"type":"client","logic":"POSITIVE","decisionStrategy":"UNANIMOUS","name":"Client auth-server Policy","clients":["'$AUTH_SERVER_CLIENT_ID'"]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/policy/client --config $CONFIG_PATH -r lagoon -f -
    AUTH_SERVER_CLIENT_POLICY_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/policy?name=Client+auth-server+Policy --config $CONFIG_PATH | jq -r '.[0]["id"]')
    # 4 Update user impersonate permission to add client policy (PUT)
    IMPERSONATE_PERMISSION_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/permission?name=admin-impersonating.permission.users --config $CONFIG_PATH | jq -r '.[0]["id"]')
    /opt/jboss/keycloak/bin/kcadm.sh update clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/permission/scope/$IMPERSONATE_PERMISSION_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'policies=["'$AUTH_SERVER_CLIENT_POLICY_ID'"]'



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

    # Setup platform wide roles.
    /opt/jboss/keycloak/bin/kcadm.sh create roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=platform-owner
    /opt/jboss/keycloak/bin/kcadm.sh add-roles --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} --rname admin --rolename platform-owner

    # Configure keycloak for api
    echo Creating client api
    echo '{"clientId": "api", "publicClient": false, "standardFlowEnabled": false, "serviceAccountsEnabled": true, "authorizationServicesEnabled": true, "secret": "'$KEYCLOAK_API_CLIENT_SECRET'"}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
    ADMIN_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/admin --config $CONFIG_PATH | jq -r '.["id"]')
    GUEST_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/guest --config $CONFIG_PATH | jq -r '.["id"]')
    REPORTER_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/reporter --config $CONFIG_PATH | jq -r '.["id"]')
    DEVELOPER_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/developer --config $CONFIG_PATH | jq -r '.["id"]')
    MAINTAINER_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/maintainer --config $CONFIG_PATH | jq -r '.["id"]')
    OWNER_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/owner --config $CONFIG_PATH | jq -r '.["id"]')
    PLATFORM_OWNER_ROLE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon roles/platform-owner --config $CONFIG_PATH | jq -r '.["id"]')

    # Resource Scopes
    resource_scope_names=(add add:development add:production addGroup addNoExec addNotification addOrUpdate:development addOrUpdate:production addUser delete delete:development delete:production deleteAll deleteNoExec deploy:development deploy:production drushArchiveDump:development drushArchiveDump:production drushCacheClear:development drushCacheClear:production drushRsync:destination:development drushRsync:destination:production drushRsync:source:development drushRsync:source:production drushSqlDump:development drushSqlDump:production drushSqlSync:destination:development drushSqlSync:destination:production drushSqlSync:source:development drushSqlSync:source:production environment:add:development environment:add:production environment:view:development environment:view:production getBySshKey invoke:guest invoke:developer invoke:maintainer create:advanced delete:advanced project:add project:view removeAll removeGroup removeNotification removeUser ssh:development ssh:production storage update update:development update:production view view:token view:user viewAll viewPrivateKey)
    for rsn_key in ${!resource_scope_names[@]}; do
        echo Creating resource scope ${resource_scope_names[$rsn_key]}
        /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/scope --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name=${resource_scope_names[$rsn_key]}
    done

    # Resources with scopes
    echo Creating resource backup
    echo '{"name":"backup","displayName":"backup","scopes":[{"name":"view"},{"name":"add"},{"name":"delete"},{"name":"deleteAll"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource restore
    echo '{"name":"restore","displayName":"restore","scopes":[{"name":"add"},{"name":"addNoExec"},{"name":"update"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource deployment
    echo '{"name":"deployment","displayName":"deployment","scopes":[{"name":"view"},{"name":"update"},{"name":"delete"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource env_var
    echo '{"name":"env_var","displayName":"env_var","scopes":[{"name":"project:view"},{"name":"project:add"},{"name":"environment:view:production"},{"name":"environment:view:development"},{"name":"environment:add:production"},{"name":"environment:add:development"},{"name":"delete"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource task
    echo '{"name":"task","displayName":"task","scopes":[{"name":"view"},{"name":"update"},{"name":"delete"},{"name":"add:production"},{"name":"add:development"},{"name":"addNoExec"},{"name":"drushArchiveDump:development"},{"name":"drushArchiveDump:production"},{"name":"drushSqlDump:development"},{"name":"drushSqlDump:production"},{"name":"drushCacheClear:development"},{"name":"drushCacheClear:production"},{"name":"drushSqlSync:source:development"},{"name":"drushSqlSync:source:production"},{"name":"drushSqlSync:destination:development"},{"name":"drushSqlSync:destination:production"},{"name":"drushRsync:source:development"},{"name":"drushRsync:source:production"},{"name":"drushRsync:destination:development"},{"name":"drushRsync:destination:production"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource openshift
    echo '{"name":"openshift","displayName":"openshift","scopes":[{"name":"add"},{"name":"delete"},{"name":"update"},{"name":"deleteAll"},{"name":"view"},{"name":"viewAll"},{"name":"view:token"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource user
    echo '{"name":"user","displayName":"user","scopes":[{"name":"add"},{"name":"getBySshKey"},{"name":"update"},{"name":"delete"},{"name":"deleteAll"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource environment
    echo '{"name":"environment","displayName":"environment","scopes":[{"name":"ssh:production"},{"name":"ssh:development"},{"name":"view"},{"name":"deploy:production"},{"name":"deploy:development"},{"name":"addOrUpdate:production"},{"name":"addOrUpdate:development"},{"name":"storage"},{"name":"delete:production"},{"name":"delete:development"},{"name":"deleteNoExec"},{"name":"update:production"},{"name":"update:development"},{"name":"viewAll"},{"name":"deleteAll"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource project
    echo '{"name":"project","displayName":"project","scopes":[{"name":"update"},{"name":"add"},{"name":"addGroup"},{"name":"removeGroup"},{"name":"addNotification"},{"name":"removeNotification"},{"name":"view"},{"name":"delete"},{"name":"deleteAll"},{"name":"viewAll"},{"name":"viewPrivateKey"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource group
    echo '{"name":"group","displayName":"group","scopes":[{"name":"add"},{"name":"update"},{"name":"delete"},{"name":"deleteAll"},{"name":"addUser"},{"name":"removeUser"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource notification
    echo '{"name":"notification","displayName":"notification","scopes":[{"name":"add"},{"name":"delete"},{"name":"view"},{"name":"deleteAll"},{"name":"removeAll"},{"name":"update"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    echo Creating resource ssh_key
    echo '{"name":"ssh_key","displayName":"ssh_key","scopes":[{"name":"view:user"},{"name":"view:project"},{"name":"add"},{"name":"deleteAll"},{"name":"removeAll"},{"name":"update"},{"name":"delete"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -

    # Authorization policies
    echo Creating api authz js policies

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for realm is Platform Owner",
  "description": "Checks the users role for the realm is Platform Owner or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\n\nif (!ctxAttr.exists('currentUser')) {\n    $evaluation.deny();\n} else {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for realm is Admin",
  "description": "Checks the users role for the realm is Admin",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\n\nif (!ctxAttr.exists('currentUser')) {\n    $evaluation.deny();\n} else {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'admin')) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for group is Developer",
  "description": "Checks the users role for a group is Developer or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 1,\n    reporter: 0,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userGroupRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userGroupRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for project is Developer",
  "description": "Checks the users role for a project is Developer or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 1,\n    reporter: 0,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userProjectRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userProjectRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "User has access to project",
  "description": "Checks that the user has access to a project via groups",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\n\n// Check projects calculated by lagoon\nif (!ctxAttr.exists('projectQuery') || !ctxAttr.exists('userProjects')) {\n    $evaluation.deny();\n} else {\n    var project = ctxAttr.getValue('projectQuery').asString(0);\n    var projects = ctxAttr.getValue('userProjects').asString(0);\n    var projectsArr = projects.split('-');\n    var grant = false;\n\n    for (var i=0; i<projectsArr.length; i++) {\n        if (project == projectsArr[i]) {\n            grant = true;\n            break;\n        }\n    }\n\n    if (grant) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for project is Reporter",
  "description": "Checks the users role for a project is Reporter or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 1,\n    reporter: 1,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userProjectRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userProjectRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "User has access to own data",
  "description": "Checks that the current user is same as queried",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\n\nif (!ctxAttr.exists('usersQuery') || !ctxAttr.exists('currentUser')) {\n    $evaluation.deny();\n} else {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n    var users = ctxAttr.getValue('usersQuery').asString(0);\n    var usersArr = users.split('|');\n    var grant = false;\n    \n    for (var i=0; i<usersArr.length; i++) {\n        if (currentUser == usersArr[i]) {\n            grant = true;\n            break;\n        }\n    }\n\n    if (grant) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for group is Guest",
  "description": "Checks the users role for a group is Guest or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 1,\n    reporter: 1,\n    guest: 1,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userGroupRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userGroupRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for group is Maintainer",
  "description": "Checks the users role for a group is Maintainer or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 0,\n    reporter: 0,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userGroupRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userGroupRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for project is Guest",
  "description": "Checks the users role for a project is Guest or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 1,\n    reporter: 1,\n    guest: 1,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userProjectRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userProjectRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for project is Maintainer",
  "description": "Checks the users role for a project is Maintainer or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 0,\n    reporter: 0,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userProjectRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userProjectRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for group is Reporter",
  "description": "Checks the users role for a group is Reporter or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 1,\n    developer: 1,\n    reporter: 1,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userGroupRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userGroupRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for group is Owner",
  "description": "Checks the users role for a group is Owner or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 0,\n    developer: 0,\n    reporter: 0,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userGroupRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userGroupRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/policy/js --config $CONFIG_PATH -r lagoon -f - <<'EOF'
{
  "name": "Users role for project is Owner",
  "description": "Checks the users role for a project is Owner or higher",
  "type": "js",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "code": "var realm = $evaluation.getRealm();\nvar ctx = $evaluation.getContext();\nvar ctxAttr = ctx.getAttributes();\nvar validRoles = {\n    owner: 1,\n    maintainer: 0,\n    developer: 0,\n    reporter: 0,\n    guest: 0,\n};\n\n// Check roles calculated by lagoon\nif (!ctxAttr.exists('userProjectRole')) {\n    $evaluation.deny();\n} else {\n    var groupRole = ctxAttr.getValue('userProjectRole').asString(0);\n\n    if (validRoles[groupRole.toLowerCase()]) {\n        $evaluation.grant();\n    } else {\n        $evaluation.deny();\n    }\n}\n\n// Check admin access\nif (ctxAttr.exists('currentUser')) {\n    var currentUser = ctxAttr.getValue('currentUser').asString(0);\n\n    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {\n        $evaluation.grant();\n    }\n}"
}
EOF

    #Authorization permissions
    echo Creating api authz permissions
    DEFAULT_PERMISSION_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Default+Permission --config $CONFIG_PATH | jq -r '.[0]["id"]')
    /opt/jboss/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/permission/$DEFAULT_PERMISSION_ID --config $CONFIG_PATH


    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Task",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["view"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Environment Variable for Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["environment:view:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Task",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["update"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Environment Variable to Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["environment:add:production"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["delete:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Backup",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["backup"],
  "scopes": ["delete"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush sql-sync from Any Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushSqlSync:source:production","drushSqlSync:source:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Group",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["group"],
  "scopes": ["update"],
  "policies": ["Users role for group is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Environment Variable to Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["environment:add:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Backups",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["backup"],
  "scopes": ["view"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Restore",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["restore"],
  "scopes": ["update"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Deployment to Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["deploy:production"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add or Update Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["addOrUpdate:production"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete All Backups",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["backup"],
  "scopes": ["deleteAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Deployments",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["deployment"],
  "scopes": ["view"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add User",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["user"],
  "scopes": ["add"],
  "policies": ["Default Policy"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add or Update Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["addOrUpdate:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF


    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Notification",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["notification"],
  "scopes": ["view"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Projects",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["viewAll"],
  "policies": ["Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["delete:production"],
  "policies": ["Users role for project is Owner","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Notification to Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["addNotification"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Task",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["delete"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["view"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Group",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["group"],
  "scopes": ["add"],
  "policies": ["Default Policy"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Environment Variable for Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["project:view"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Project Private Key",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["viewPrivateKey"],
  "policies": ["User has access to project","Users role for project is Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete All Groups",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["group"],
  "scopes": ["deleteAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete All Users",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["user"],
  "scopes": ["deleteAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Manage Openshift",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["openshift"],
  "scopes": ["delete","update","deleteAll","add","view:token"],
  "policies": ["Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Openshifts",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["openshift"],
  "scopes": ["viewAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete SSH Key",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["ssh_key"],
  "scopes": ["delete"],
  "policies": ["User has access to own data","Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Environment Variable to Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["project:add"],
  "policies": ["Users role for project is Owner","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["add"],
  "policies": ["Default Policy"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Get SSH Keys for User",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["ssh_key"],
  "scopes": ["view:user"],
  "policies": ["User has access to own data","Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Openshift",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["openshift"],
  "scopes": ["view"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush rsync from Any Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushRsync:source:production","drushRsync:source:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete All SSH Keys",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["ssh_key"],
  "scopes": ["removeAll","deleteAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Environment Metrics",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["storage"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush sql-sync to Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushSqlSync:destination:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush cache-clear",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushCacheClear:production","drushCacheClear:development"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add User to Group",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["group"],
  "scopes": ["addUser"],
  "policies": ["Users role for group is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Backup",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["backup"],
  "scopes": ["add"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush sql-sync to Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushSqlSync:destination:production"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["update:production"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush rsync to Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushRsync:destination:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update SSH Key",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["ssh_key"],
  "scopes": ["update"],
  "policies": ["User has access to own data","Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Task to Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["add:production"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Task to Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["add:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF


    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add SSH Key",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["ssh_key"],
  "scopes": ["add"],
  "policies": ["User has access to own data","Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete All Notifications",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["notification"],
  "scopes": ["removeAll","deleteAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "CUD Notification",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["notification"],
  "scopes": ["delete","update","add"],
  "policies": ["Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Groups to Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["addGroup"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Deployment to Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["deploy:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete All Environments",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["deleteAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Deployment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["deployment"],
  "scopes": ["update"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Deployment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["deployment"],
  "scopes": ["delete"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["update"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Remove Notification from Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["removeNotification"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete User",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["user"],
  "scopes": ["delete"],
  "policies": ["User has access to own data","Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete All Projects",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["deleteAll"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Remove User from Group",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["group"],
  "scopes": ["removeUser"],
  "policies": ["Users role for group is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["view"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Group",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["group"],
  "scopes": ["delete"],
  "policies": ["Users role for group is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Restore",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["restore"],
  "scopes": ["add"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush archive-dump",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushArchiveDump:production","drushArchiveDump:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update User",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "AFFIRMATIVE",
  "resources": ["user"],
  "scopes": ["update"],
  "policies": ["User has access to own data","Users role for realm is Platform Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["delete"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Remove Groups from Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["removeGroup"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush rsync to Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushRsync:destination:production"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush sql-dump",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushSqlDump:production","drushSqlDump:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Environment Variable for Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["environment:view:production"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["project"],
  "scopes": ["delete"],
  "policies": ["User has access to project","Users role for project is Owner"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Environment Variable",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["delete"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Update Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["update:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "User can SSH to Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["ssh:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "User can SSH to Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["environment"],
  "scopes": ["ssh:production"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}

EOF

    # http://localhost:8088/auth/admin/realms/lagoon/clients/1329f641-a440-44a7-996f-ed1c560e2edd/authz/resource-server/permission/scope
    # {"type":"scope","logic":"POSITIVE","decisionStrategy":"UNANIMOUS","name":"Backup View","resources":["2ebb5852-6624-4dc6-8374-e1e54a7fd9c5"],"scopes":["8e78b877-f930-43ff-995f-c907af64f69f"],"policies":["d4fae4e2-ddc7-462c-b712-d68aaeb269e1"]}
}

function add_group_viewall {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  view_all_groups=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+All+Groups --config $CONFIG_PATH)

  if [ "$view_all_groups" != "[ ]" ]; then
      echo "group:viewAll already configured"
      return 0
  fi

  echo Configuring group:viewAll

  GROUP_RESOURCE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=group --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$GROUP_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"add"},{"name":"update"},{"name":"delete"},{"name":"deleteAll"},{"name":"addUser"},{"name":"removeUser"},{"name":"viewAll"}]'

  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View All Groups",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["group"],
  "scopes": ["viewAll"],
  "policies": ["Users role for realm is Platform Owner"]
}
EOF
}

function add_deployment_cancel {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  cancel_deployment=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Cancel+Deployment --config $CONFIG_PATH)

  if [ "$cancel_deployment" != "[ ]" ]; then
      echo "deployment:cancel already configured"
      return 0
  fi

  echo Configuring deployment:cancel

  DEPLOYMENT_RESOURCE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=deployment --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$DEPLOYMENT_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"view"},{"name":"update"},{"name":"delete"},{"name":"cancel"}]'

  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Cancel Deployment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["deployment"],
  "scopes": ["cancel"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF
}

function configure_task_cron {

  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  cron_task_groups=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Run+Drush+cron --config $CONFIG_PATH)

  if [ "$cron_task_groups" != "[ ]" ]; then
    echo "group:drushCron already configured"
    return 0
  fi

  echo Configuring group:drushCron

  # Create new scopes
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/scope --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name="drushCron:development"
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/scope --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name="drushCron:production"

  # Add new scopes to resources
  TASK_RESOURCE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=task --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$TASK_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"view"},{"name":"update"},{"name":"delete"},{"name":"invoke"},{"name":"add:production"},{"name":"add:development"},{"name":"addNoExec"},{"name":"drushArchiveDump:development"},{"name":"drushArchiveDump:production"},{"name":"drushSqlDump:development"},{"name":"drushSqlDump:production"},{"name":"drushCacheClear:development"},{"name":"drushCacheClear:production"},{"name":"drushCron:development"},{"name":"drushCron:production"},{"name":"drushSqlSync:source:development"},{"name":"drushSqlSync:source:production"},{"name":"drushSqlSync:destination:development"},{"name":"drushSqlSync:destination:production"},{"name":"drushRsync:source:development"},{"name":"drushRsync:source:production"},{"name":"drushRsync:destination:development"},{"name":"drushRsync:destination:production"}]'


  # Create new permission
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush cron",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushCron:production","drushCron:development"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF
}

function configure_task_uli {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  uli_task=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Run+Drush+uli+on+Production+Environment --config $CONFIG_PATH)

  if [ "$uli_task" != "[ ]" ]; then
    echo "scopes:drushUserLogin already configured"
    return 0
  fi

  echo Configuring group:drushUserLogin

  # Create new scopes
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/scope --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name="drushUserLogin:development"
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/scope --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s name="drushUserLogin:production"

  # Add new scopes to resources
  TASK_RESOURCE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=task --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$TASK_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"view"},{"name":"update"},{"name":"delete"},{"name":"add:production"},{"name":"add:development"},{"name":"addNoExec"},{"name":"drushArchiveDump:development"},{"name":"drushArchiveDump:production"},{"name":"drushSqlDump:development"},{"name":"drushSqlDump:production"},{"name":"drushCacheClear:development"},{"name":"drushCacheClear:production"},{"name":"drushCron:development"},{"name":"drushCron:production"},{"name":"drushUserLogin:development"},{"name":"drushUserLogin:production"},{"name":"drushSqlSync:source:development"},{"name":"drushSqlSync:source:production"},{"name":"drushSqlSync:destination:development"},{"name":"drushSqlSync:destination:production"},{"name":"drushRsync:source:development"},{"name":"drushRsync:source:production"},{"name":"drushRsync:destination:development"},{"name":"drushRsync:destination:production"}]'


  # Create new permissions
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush uli on Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushUserLogin:production"],
  "policies": ["User has access to project","Users role for project is Maintainer"]
}
EOF

  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Run Drush uli on Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["task"],
  "scopes": ["drushUserLogin:development"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

}

function configure_problems_system {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  problems_system=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Problems --config $CONFIG_PATH)

  if [ "$problems_system" != "[ ]" ]; then
    echo "Problems Permissions already configured"
    return 0
  fi

  echo Configuring Problems Permissions

  echo '{"name":"problem","displayName":"problem","scopes":[{"name":"view"},{"name":"add"},{"name":"delete"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -

  # Create new permissions
    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Problems",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["problem"],
  "scopes": ["view"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Problem",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["problem"],
  "scopes": ["add"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Problem",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["problem"],
  "scopes": ["delete"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

}


function configure_harbor_scan_system {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  hs_system=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Harbor+Scan+Match --config $CONFIG_PATH)

  if [ "$hs_system" != "[ ]" ]; then
    echo "Harbor Scan Match Permissions already configured"
    return 0
  fi

  echo Configuring Harbor Scan Match Permissions

  echo '{"name":"harbor_scan_match","displayName":"Harbor scan match","scopes":[{"name":"view"},{"name":"add"},{"name":"delete"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -

  # Create new permissions
    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Harbor Scan Match",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["harbor_scan_match"],
  "scopes": ["view"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Harbor Scan Match",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["harbor_scan_match"],
  "scopes": ["add"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Harbor Scan Match",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["harbor_scan_match"],
  "scopes": ["delete"],
  "policies": ["Users role for realm is Admin"]
}
EOF

}


function configure_facts_system {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  facts_system=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=View+Facts --config $CONFIG_PATH)

  if [ "$facts_system" != "[ ]" ]; then
    echo "Facts Permissions already configured"
    return 0
  fi

  echo Configuring Facts Permissions

  echo '{"name":"fact","displayName":"fact","scopes":[{"name":"view"},{"name":"add"},{"name":"delete"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -

  # Create new permissions
    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Facts",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["fact"],
  "scopes": ["view"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Fact",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["fact"],
  "scopes": ["add"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Fact",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["fact"],
  "scopes": ["delete"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

}


function configure_advanced_task_system {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  facts_system=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Invoke+Task+Guest --config $CONFIG_PATH)

  if [ "$facts_system" != "[ ]" ]; then
    echo "Advanced Task Permissions already configured"
    return 0
  fi

  echo Configuring Advanced Task Permissions

  echo '{"name":"advanced_task","displayName":"advanced_task","scopes":[{"name":"invoke:guest"}, {"name":"invoke:developer"},{"name":"invoke:maintainer"}, {"name":"create:advanced"}, {"name":"delete:advanced"}],"attributes":{},"uris":[],"ownerManagedAccess":""}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/resource --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -

  # Create new permissions
    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Invoke Task Guest",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["advanced_task"],
  "scopes": ["invoke:guest"],
  "policies": ["User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Invoke Task Maintainer",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["advanced_task"],
  "scopes": ["invoke:maintainer"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Invoke Task Developer",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["advanced_task"],
  "scopes": ["invoke:developer"],
  "policies": ["Users role for project is Developer","User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Create Image Based Task",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["advanced_task"],
  "scopes": ["create:advanced"],
  "policies": ["Users role for realm is Admin"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Advanced Task",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["advanced_task"],
  "scopes": ["delete:advanced"],
  "policies": ["Users role for realm is Admin"]
}
EOF

}

function remove_billing_modifier {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  billing_modifier=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+All+Billing+Group+Modifiers --config $CONFIG_PATH)

  if [ "$billing_modifier" == "[ ]" ]; then
      echo Billing modifiers already removed
      return 0
  fi

  echo Removing billing_modifier authz

  permissions=$(/opt/jboss/keycloak/bin/kcadm.sh get clients/$CLIENT_ID/authz/resource-server/permission?resource=billing_modifier --fields id --format csv --noquotes --config $CONFIG_PATH -r lagoon)
  for permission in $permissions
  do
    /opt/jboss/keycloak/bin/kcadm.sh delete clients/$CLIENT_ID/authz/resource-server/permission/$permission --config $CONFIG_PATH -r lagoon
  done

  billing_modifier_resource_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=billing_modifier --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/jboss/keycloak/bin/kcadm.sh delete -r lagoon clients/$CLIENT_ID/authz/resource-server/resource/$billing_modifier_resource_id --config $CONFIG_PATH
}

function update_openshift_view_permission {
  local api_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  local openshift_view_permission_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/permission?name=View+Openshift --config $CONFIG_PATH | jq -r '.[0]["id"]')
  local associated_policies=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/policy/$openshift_view_permission_id/associatedPolicies --config $CONFIG_PATH | jq -c 'map({name})')

  if [ "$associated_policies" != '[{"name":"Users role for project is Maintainer"},{"name":"User has access to project"}]' ]; then
    echo \"View Openshift\" permissions already updated
    return 0;
  fi

  echo Updating \"View Openshift\" permissions

  /opt/jboss/keycloak/bin/kcadm.sh delete -r lagoon clients/$api_client_id/authz/resource-server/permission/$openshift_view_permission_id --config $CONFIG_PATH
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$api_client_id/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "View Openshift",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["openshift"],
  "scopes": ["view"],
  "policies": ["User has access to project","Users role for project is Guest"]
}
EOF
}

function configure_service_api_client {
    service_api_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=service-api --config $CONFIG_PATH)
    if [ "$service_api_client_id" != "[ ]" ]; then
        echo "Client service-api is already created, skipping basic setup"
        return 0
    fi
    echo Creating client service-api
    echo '{"clientId": "service-api", "publicClient": false, "standardFlowEnabled": false, "serviceAccountsEnabled": true, "secret": "'$KEYCLOAK_SERVICE_API_CLIENT_SECRET'"}' | /opt/jboss/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -f -
    SERVICE_API_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=service-api --config $CONFIG_PATH | jq -r '.[0]["id"]')
    REALM_MANAGEMENT_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=realm-management --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo Enable fine grained permissions
    # 2 Enable fine grained admin permissions for client
    /opt/jboss/keycloak/bin/kcadm.sh update clients/$SERVICE_API_CLIENT_ID/management/permissions --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s enabled=true

    CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=service-api --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo Creating groups mapper for service-api
    echo '{"protocol":"openid-connect","config":{"full.path":"true","id.token.claim":"false","access.token.claim":"true","userinfo.token.claim":"false","claim.name":"group_membership"},"name":"Group Membership","protocolMapper":"oidc-group-membership-mapper"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -
    echo Creating realm roles mapper for service-api
    echo '{"protocol":"openid-connect","config":{"multivalued":"true","id.token.claim":"false","access.token.claim":"true","userinfo.token.claim":"false","claim.name":"realm_roles"},"name":"User Realm Roles","protocolMapper":"oidc-usermodel-realm-role-mapper"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -
    echo Creating group lagoon project IDs mapper for service-api
    echo '{"protocol":"openid-connect","config":{"id.token.claim":"false","access.token.claim":"true","userinfo.token.claim":"false","multivalued":"true","aggregate.attrs":"true","user.attribute":"group-lagoon-project-ids","claim.name":"group_lagoon_project_ids","jsonType.label":"String"},"name":"Group Lagoon Project IDs","protocolMapper":"oidc-usermodel-attribute-mapper"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -
}

function configure_lagoon_opensearch_sync_client {
    local client
    client=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=lagoon-opensearch-sync --config "$CONFIG_PATH")
    if [ "$client" != "[ ]" ]; then
        echo "Client lagoon-opensearch-sync is already created, skipping basic setup"
        return 0
    fi
    echo Creating client lagoon-opensearch-sync
    # create client
    local clientID
    clientID=$(/opt/jboss/keycloak/bin/kcadm.sh create clients --config "$CONFIG_PATH" -r "${KEYCLOAK_REALM:-master}" -i -f - <<EOF
{
    "clientId": "lagoon-opensearch-sync",
    "directAccessGrantsEnabled": false,
    "publicClient": false,
    "serviceAccountsEnabled": true,
    "standardFlowEnabled": false
}
EOF
)
    # generate secret
    /opt/jboss/keycloak/bin/kcadm.sh \
      create "clients/$clientID/client-secret" \
      --config "$CONFIG_PATH" -r "${KEYCLOAK_REALM:-master}"
    # add realm-management role to serviceaccount
    /opt/jboss/keycloak/bin/kcadm.sh \
      add-roles \
      --uusername service-account-lagoon-opensearch-sync \
      --cclientid realm-management \
      --rolename query-groups \
      --config "$CONFIG_PATH" -r "${KEYCLOAK_REALM:-master}"
}

function configure_token_exchange {
    REALM_MANAGEMENT_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=realm-management --config $CONFIG_PATH | jq -r '.[0]["id"]')
    IMPERSONATE_PERMISSION_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/permission?name=admin-impersonating.permission.users --config $CONFIG_PATH | jq -r '.[0]["id"]')
    # check if policies already exist
    service_api_client_policy_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/policy?name=Client+service-api+Policy --config $CONFIG_PATH)
    if [ "$service_api_client_policy_id" != "[ ]" ]; then
        echo "Client service-api policies are already created, skipping policy setup"
        return 0
    fi

    # create client service-api policy
    SERVICE_API_CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get  -r lagoon clients?clientId=service-api --config $CONFIG_PATH | jq -r '.[0]["id"]')
    echo '{"type":"client","logic":"POSITIVE","decisionStrategy":"UNANIMOUS","name":"Client service-api Policy","clients":["'$SERVICE_API_CLIENT_ID'"]}' | /opt/jboss/keycloak/bin/kcadm.sh create clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/policy/client --config $CONFIG_PATH -r lagoon -f -
    SERVICE_API_CLIENT_POLICY_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/policy?name=Client+service-api+Policy --config $CONFIG_PATH | jq -r '.[0]["id"]')

    echo Enable token exchange for auth-server and service-api
    # get auth-server client ID configured in configure_api_client
    AUTH_SERVER_CLIENT_POLICY_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/policy?name=Client+auth-server+Policy --config $CONFIG_PATH | jq -r '.[0]["id"]')
    # The decision strategy is affirmative since only one policy has to pass.
    /opt/jboss/keycloak/bin/kcadm.sh update clients/$REALM_MANAGEMENT_CLIENT_ID/authz/resource-server/permission/scope/$IMPERSONATE_PERMISSION_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'policies=["'$AUTH_SERVER_CLIENT_POLICY_ID'","'$SERVICE_API_CLIENT_POLICY_ID'"]' -s 'decisionStrategy="AFFIRMATIVE"'
}

function update_add_env_var_to_project {
  local api_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  local env_var_project_add_permission_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/permission?name=Add+Environment+Variable+to+Project --config $CONFIG_PATH | jq -r '.[0]["id"]')
  local associated_policies=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/policy/$env_var_project_add_permission_id/associatedPolicies --config $CONFIG_PATH | jq -c 'map({name})')

  if [ "$associated_policies" != '[{"name":"Users role for project is Owner"},{"name":"User has access to project"}]' ]; then
    echo \"Add Environment Variable to Project\" permissions already updated
    return 0;
  fi

  echo Updating \"Add Environment Variable to Project\" permissions

  /opt/jboss/keycloak/bin/kcadm.sh delete -r lagoon clients/$api_client_id/authz/resource-server/permission/$env_var_project_add_permission_id --config $CONFIG_PATH
  /opt/jboss/keycloak/bin/kcadm.sh create clients/$api_client_id/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Add Environment Variable to Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["project:add"],
  "policies": ["Users role for project is Maintainer","User has access to project"]
}
EOF
}

function migrate_to_js_provider {
    # Check if mapper is "upload_script" based
    local opendistro_security_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=lagoon-opendistro-security --config $CONFIG_PATH | jq -r '.[0]["id"]')
    local lagoon_opendistro_security_mappers=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$opendistro_security_client_id/protocol-mappers/models --config $CONFIG_PATH)
    local lagoon_opendistro_security_mapper_groups=$(echo $lagoon_opendistro_security_mappers | jq -r '.[] | select(.name=="groups") | .protocolMapper')
    if [ "$lagoon_opendistro_security_mapper_groups" != "oidc-script-based-protocol-mapper" ]; then
        echo "upload_scripts already migrated"
        return 0
    fi

    echo Migrating "upload_scripts" to javascript provider

    ################
    # Update Mappers
    ################

    local old_mapper_id=$(echo $lagoon_opendistro_security_mappers | jq -r '.[] | select(.name=="groups") | .id')
    /opt/jboss/keycloak/bin/kcadm.sh delete -r lagoon clients/$opendistro_security_client_id/protocol-mappers/models/$old_mapper_id --config $CONFIG_PATH
    echo '{"name":"groups","protocolMapper":"script-mappers/groups-and-roles.js","protocol":"openid-connect","config":{"id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","multivalued":"true","claim.name":"groups","jsonType.label":"String"}}' | /opt/jboss/keycloak/bin/kcadm.sh create -r ${KEYCLOAK_REALM:-master} clients/$opendistro_security_client_id/protocol-mappers/models --config $CONFIG_PATH -f -

    ###############################
    # Update Authorization Policies
    ###############################
    local api_client_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')

    # Build a JSON string of current authz permissions and policies. Looks like:
    # [
    #   {
    #     "id": "2be3447d-6d68-4eb6-b3ed-b1fb0475432e",
    #     "name": "Add Backup",
    #     "associatedPolicies": [
    #       {
    #         "id": "750b94fa-4faf-4eb6-8889-80b2b3eb92bf",
    #         "name": "User has access to project"
    #       },
    #       {
    #         "id": "2e529d09-43b1-4cc7-8c5e-47c9ebc5e2e1",
    #         "name": "Users role for project is Developer"
    #       }
    #     ]
    #   },
    #   ...
    # ]
    local perms=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/permission --config $CONFIG_PATH | jq -r 'map({id,name})')
    local pid
    for pid in $(echo $perms | jq -r '.[].id')
    do
      local associated_policies=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/policy/$pid/associatedPolicies --config $CONFIG_PATH | jq -c 'map({id,name})')
      perms=$(echo $perms | jq -r --arg pid "$pid" --argjson ap "$associated_policies" '(.[] | select(.id == $pid) | .associatedPolicies) |= $ap')
    done

    # List of all policies that need migrating
    local policies='User has access to own data;User has access to project;Users role for group is Owner;Users role for group is Maintainer;Users role for group is Developer;Users role for group is Reporter;Users role for group is Guest;Users role for project is Owner;Users role for project is Maintainer;Users role for project is Developer;Users role for project is Reporter;Users role for project is Guest;Users role for realm is Admin;Users role for realm is Platform Owner'

    OLDIFS=$IFS;IFS=";";
    local p_name
    for p_name in $policies
    do
      # Add the new script based policy to the api client
      local script_name="[Lagoon] $p_name"
      local script_type="script-policies/$(echo $p_name | sed -e 's/.*/\L&/' -e 's/ /-/g').js"
      echo '{"name":"'$script_name'","type":"'$script_type'"}' | /opt/jboss/keycloak/bin/kcadm.sh create -r lagoon clients/$api_client_id/authz/resource-server/policy/$(echo $script_type | sed -e 's/\//%2F/') --config $CONFIG_PATH -f -

      # Do an in-place update of the permissions JSON to replace old JS policy references with new script policy
      local script_policy=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/policy/?name=$(echo $script_name | sed -e 's/\[/%5B/' -e 's/\]/%5D/' -e 's/ /+/g') --config $CONFIG_PATH | jq -r '.[] | {id,name}')
      perms=$(echo $perms | jq -r --arg name "$p_name" --argjson policy "$script_policy" '(.[].associatedPolicies[] | select(.name == $name)) |= $policy')
    done
    IFS=$OLDIFS

    # Update the permissions in keycloak.
    # Removes old policies and adds new ones all in one step.
    for pid in $(echo $perms | jq -r '.[].id')
    do
      local new_policies=$(echo $perms | jq -c --arg pid "$pid" '.[] | select(.id == $pid) | .associatedPolicies | map(.id)')
      /opt/jboss/keycloak/bin/kcadm.sh update clients/$api_client_id/authz/resource-server/permission/scope/$pid --config $CONFIG_PATH -r lagoon -s "policies=${new_policies}"
    done

    # Delete old JS policies
    OLDIFS=$IFS;IFS=";";
    for p_name in $policies
    do
      local js_policy_id=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$api_client_id/authz/resource-server/policy/?name=$(echo $p_name | sed -e 's/ /+/g') --config $CONFIG_PATH | jq -r --arg name $p_name '.[] | select(.name == $name) | .id')
      /opt/jboss/keycloak/bin/kcadm.sh delete -r lagoon clients/$api_client_id/authz/resource-server/policy/js/$js_policy_id --config $CONFIG_PATH
    done
    IFS=$OLDIFS
}

function add_delete_env_var_permissions {
  CLIENT_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients?clientId=api --config $CONFIG_PATH | jq -r '.[0]["id"]')
  delete_env_var_from_production_environment=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/permission?name=Delete+Environment+Variable+from+Production+Environment --config $CONFIG_PATH)

  if [ "$delete_env_var_from_production_environment" != "[ ]" ]; then
      echo "project:delete and environment:delete:x on env_var already configured"
      return 0
  fi

  echo Configuring Delete Environment Variable permissions

  ENVVAR_RESOURCE_ID=$(/opt/jboss/keycloak/bin/kcadm.sh get -r lagoon clients/$CLIENT_ID/authz/resource-server/resource?name=env_var --config $CONFIG_PATH | jq -r '.[0]["_id"]')
  /opt/jboss/keycloak/bin/kcadm.sh update clients/$CLIENT_ID/authz/resource-server/resource/$ENVVAR_RESOURCE_ID --config $CONFIG_PATH -r ${KEYCLOAK_REALM:-master} -s 'scopes=[{"name":"project:view"},{"name":"project:add"},{"name":"project:delete"},{"name":"environment:view:production"},{"name":"environment:view:development"},{"name":"environment:add:production"},{"name":"environment:add:development"},{"name":"environment:delete:production"},{"name":"environment:delete:development"},{"name":"delete"}]'

  /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Environment Variable from Project",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["project:delete"],
  "policies": ["[Lagoon] Users role for project is Maintainer","[Lagoon] User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Environment Variable from Development Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["environment:delete:development"],
  "policies": ["[Lagoon] Users role for project is Developer","[Lagoon] User has access to project"]
}
EOF

    /opt/jboss/keycloak/bin/kcadm.sh create clients/$CLIENT_ID/authz/resource-server/permission/scope --config $CONFIG_PATH -r lagoon -f - <<EOF
{
  "name": "Delete Environment Variable from Production Environment",
  "type": "scope",
  "logic": "POSITIVE",
  "decisionStrategy": "UNANIMOUS",
  "resources": ["env_var"],
  "scopes": ["environment:delete:production"],
  "policies": ["[Lagoon] Users role for project is Maintainer","[Lagoon] User has access to project"]
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

    # Set the config file path because $HOME/.keycloak/kcadm.config resolves to /opt/jboss/?/.keycloak/kcadm.config for some reason, causing it to fail
    CONFIG_PATH=/opt/jboss/keycloak/standalone/data/.keycloak/kcadm.config

    echo Keycloak is running, proceeding with configuration

    /opt/jboss/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://$(hostname -i):8080/auth --user $KEYCLOAK_USER --password $KEYCLOAK_PASSWORD --realm master

    # Sets the order of migrations, add new ones at the end.
    configure_lagoon_realm
    configure_opendistro_security_client
    configure_api_client
    add_group_viewall
    add_deployment_cancel
    configure_task_cron
    configure_task_uli
    configure_problems_system
    configure_facts_system
    configure_harbor_scan_system
    configure_advanced_task_system
    remove_billing_modifier
    update_openshift_view_permission
    configure_service_api_client
    configure_token_exchange
    update_add_env_var_to_project
    migrate_to_js_provider
    add_delete_env_var_permissions
    configure_lagoon_opensearch_sync_client

    # always run last
    sync_client_secrets

    echo "Config of Keycloak done. Log in via admin user '$KEYCLOAK_USER' and password '$KEYCLOAK_PASSWORD'"

    # signal config complete
    touch /tmp/keycloak-config-complete
}

configure_keycloak &
