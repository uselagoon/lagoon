#!/bin/bash

# 1. The first part of this entrypoint script deals with adding realms and users. Code is a modified version of this entrypoint script:
# https://github.com/stefanjacobs/keycloak_min/blob/f26927426e60c1ec29fc0c0980e5a694a45dcc05/run.sh

function is_keycloak_running {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${KEYCLOAK_PORT}/auth/admin/realms)
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

    echo Keycloak is running, proceeding with configuration

    ${KCH}/bin/kcadm.sh config credentials --server http://localhost:${KEYCLOAK_PORT}/auth --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD --realm master

    if [ $KEYCLOAK_REALM ]; then
        echo Creating realm $KEYCLOAK_REALM
        ${KCH}/bin/kcadm.sh create realms -s realm=$KEYCLOAK_REALM -s enabled=true
    fi

    if [ "$KEYCLOAK_CLIENT_IDS" ]; then
        for client in ${KEYCLOAK_CLIENT_IDS//,/ }; do
            echo Creating client $client
            echo '{"clientId": "'${client}'", "webOrigins": ["'${KEYCLOAK_CLIENT_WEB_ORIGINS}'"], "redirectUris": ["'${KEYCLOAK_CLIENT_REDIRECT_URIS}'"]}' | ${KCH}/bin/kcadm.sh create clients -r ${KEYCLOAK_REALM:-master} -f -
        done
    fi

    if [ "$KEYCLOAK_REALM_ROLES" ]; then
        for role in ${KEYCLOAK_REALM_ROLES//,/ }; do
            echo Creating role $role
            ${KCH}/bin/kcadm.sh create roles -r ${KEYCLOAK_REALM:-master} -s name=${role}
        done
    fi

    if [ "$KEYCLOAK_REALM_SETTINGS" ]; then
        echo Applying extra Realm settings
        echo $KEYCLOAK_REALM_SETTINGS | ${KCH}/bin/kcadm.sh update realms/${KEYCLOAK_REALM:-master} -f -
    fi

    if [ $KEYCLOAK_USER_USERNAME ]; then
        echo Creating user $KEYCLOAK_USER_USERNAME
        # grep would have been nice instead of the double sed, but we don't have gnu grep available, only the busybox grep which is very limited
        local user_id=$(echo '{"username": "'$KEYCLOAK_USER_USERNAME'", "enabled": true}' \
                            | ${KCH}/bin/kcadm.sh create users -r ${KEYCLOAK_REALM:-master} -f - 2>&1  | sed -e 's/Created new user with id //g' -e "s/'//g")
        echo "Created user with id ${user_id}"
        ${KCH}/bin/kcadm.sh update users/${user_id}/reset-password -r ${KEYCLOAK_REALM:-master} -s type=password -s value=${KEYCLOAK_USER_PASSWORD} -s temporary=false -n
        echo "Set password for user ${user_id}"
        if [ $KEYCLOAK_USER_ROLES ]; then
            ${KCH}/bin/kcadm.sh add-roles --uusername ${KEYCLOAK_USER_USERNAME} --rolename ${KEYCLOAK_USER_ROLES//,/ --rolename } -r ${KEYCLOAK_REALM:-master}
	    echo Added roles ${KEYCLOAK_USER_ROLES//,/ }
        fi
    fi

}

if [ ! -f /keycloak/standalone/data/docker-container-configuration-done ]; then
    touch /keycloak/standalone/data/docker-container-configuration-done
    configure_keycloak &
fi

${KCH}/bin/add-user-keycloak.sh --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD


# 2. The second part of this entrypoint script comes from the official JBoss entrypoint script:
# https://github.com/jboss-dockerfiles/keycloak/blob/4.3.0.Final/server/docker-entrypoint.sh

############
# DB setup #
############

# Lower case DB_VENDOR
DB_VENDOR=`echo $DB_VENDOR | tr A-Z a-z`

# Detect DB vendor from default host names
if [ "$DB_VENDOR" == "" ]; then
    if (getent hosts postgres &>/dev/null); then
        export DB_VENDOR="postgres"
    elif (getent hosts mysql &>/dev/null); then
        export DB_VENDOR="mysql"
    elif (getent hosts mariadb &>/dev/null); then
        export DB_VENDOR="mariadb"
    fi
fi

# Detect DB vendor from legacy `*_ADDR` environment variables
if [ "$DB_VENDOR" == "" ]; then
    if (printenv | grep '^POSTGRES_ADDR=' &>/dev/null); then
        export DB_VENDOR="postgres"
    elif (printenv | grep '^MYSQL_ADDR=' &>/dev/null); then
        export DB_VENDOR="mysql"
    elif (printenv | grep '^MARIADB_ADDR=' &>/dev/null); then
        export DB_VENDOR="mariadb"
    fi
fi

# Default to H2 if DB type not detected
if [ "$DB_VENDOR" == "" ]; then
    export DB_VENDOR="h2"
fi

# Set DB name
case "$DB_VENDOR" in
    postgres)
        DB_NAME="PostgreSQL";;
    mysql)
        DB_NAME="MySQL";;
    mariadb)
        DB_NAME="MariaDB";;
    h2)
        DB_NAME="Embedded H2";;
    *)
        echo "Unknown DB vendor $DB_VENDOR"
        exit 1
esac

# Append '?' in the beggining of the string if JDBC_PARAMS value isn't empty
export JDBC_PARAMS=$(echo ${JDBC_PARAMS} | sed '/^$/! s/^/?/')

# Convert deprecated DB specific variables
function set_legacy_vars() {
  local suffixes=(ADDR DATABASE USER PASSWORD PORT)
  for suffix in "${suffixes[@]}"; do
    local varname="$1_$suffix"
    if [ ${!varname} ]; then
      echo WARNING: $varname variable name is DEPRECATED replace with DB_$suffix
      export DB_$suffix=${!varname}
    fi
  done
}
set_legacy_vars `echo $DB_VENDOR | tr a-z A-Z`

# Configure DB

echo "========================================================================="
echo ""
echo "  Using $DB_NAME database"
echo ""
echo "========================================================================="
echo ""

if [ "$DB_VENDOR" != "h2" ]; then
    /bin/sh /opt/jboss/keycloak/bin/change-database.sh $DB_VENDOR
fi

##################
# Start Keycloak #
##################

exec /opt/jboss/keycloak/bin/standalone.sh $@
exit $?