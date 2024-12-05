function is_keycloak_running {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/auth/admin/realms)
  if [[ $http_code -eq 401 ]]; then
    return 0
  else
    return 1
  fi
}

function configure_user_passwords {

  LAGOON_DEMO_USERS=("guest@example.com" "reporter@example.com" "developer@example.com" "maintainer@example.com" "owner@example.com")
  LAGOON_DEMO_ORG_USERS=("orguser@example.com" "orgviewer@example.com" "orgadmin@example.com" "orgowner@example.com")
  LAGOON_DEMO_PLATFORM_USERS=("platformorgowner@example.com" "platformviewer@example.com" "platformowner@example.com")

  for i in ${LAGOON_DEMO_USERS[@]}
  do
    echo Configuring password for $i
    /opt/keycloak/bin/kcadm.sh set-password --config $CONFIG_PATH --username $i -p $i --target-realm lagoon
  done

  for i in ${LAGOON_DEMO_ORG_USERS[@]}
  do
    echo Configuring password for $i
    /opt/keycloak/bin/kcadm.sh set-password --config $CONFIG_PATH --username $i -p $i --target-realm lagoon
  done

  for i in ${LAGOON_DEMO_PLATFORM_USERS[@]}
  do
    echo Configuring password for $i
    /opt/keycloak/bin/kcadm.sh set-password --config $CONFIG_PATH --username $i -p $i --target-realm lagoon
  done
}

function configure_keycloak {
  until is_keycloak_running; do
    echo Keycloak still not running, waiting 5 seconds
    sleep 5
  done

  # Set the config file path because $HOME/.keycloak/kcadm.config resolves to /opt/jboss/?/.keycloak/kcadm.config for some reason, causing it to fail
  CONFIG_PATH=/tmp/kcadm.config

  echo Keycloak is running, proceeding with configuration

  /opt/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD --realm master

  configure_user_passwords

  echo "Config of Keycloak users done"
}

configure_keycloak