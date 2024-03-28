#!/bin/bash
set -e

# inject variables from environment into the Ansible var template
envsubst '$API_HOST $API_PORT $API_PROTOCOL $CLUSTER_TYPE $DELETED_STATUS_CODE $GIT_HOST $GIT_REPO_PREFIX $GIT_PORT $ROUTE_SUFFIX_HTTP $ROUTE_SUFFIX_HTTP_PORT $ROUTE_SUFFIX_HTTPS $ROUTE_SUFFIX_HTTPS_PORT $SSH_HOST $SSH_PORT $SSH_PORTAL_HOST $SSH_PORTAL_PORT $SSH_TOKEN_HOST $SSH_TOKEN_PORT $WEBHOOK_HOST $WEBHOOK_PORT $WEBHOOK_PROTOCOL $WEBHOOK_REPO_PREFIX' < /ansible/tests/vars/test_vars.yaml | sponge /ansible/tests/vars/test_vars.yaml

if [ ! -z "$SSH_PRIVATE_KEY" ]; then
  mkdir -p ~/.ssh
  echo -e "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
  chmod 400 ~/.ssh/id_rsa
  rm -f $SSH_AUTH_SOCK
  eval $(ssh-agent -a $SSH_AUTH_SOCK)
  ssh-add ~/.ssh/id_rsa
fi

echo -e "Host * \n    StrictHostKeyChecking no" >> /etc/ssh/ssh_config

# store public key
ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub

add_admin_user_query() {
  admin_query_file_path="/ansible/addAdminUser.gql"
  API_ADMIN_JWT_TOKEN=$(/ansible/create_jwt.py)

  bearer="Authorization: Bearer $API_ADMIN_JWT_TOKEN"

  # GraphQL query on single line with \\n for newlines and escaped quotes
  data=$(cat $admin_query_file_path | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

  # Create a correct json string
  json="{\"query\": \"$data\"}"

  wget --header "Content-Type: application/json" --header "$bearer" "${API_HOST:-lagoon-core-api}:${API_PORT:-80}/graphql" --post-data "$json" -O -
}

# create new lagoon admin user
#echo "Add admin user"
#curl --location --request POST 'http://lagoon-core-keycloak:8080/auth/admin/realms/lagoon/users' --header 'Content-Type: application/json' --header "Authorization: Bearer $access_token" --data-raw '{"firstName":"admin","lastName":"", "email":"admin@e2e-lagoon", "enabled":"true", "username":"admin-lagoon"}'

## create lagoon admin user
map_user_role_keycloak() {
  GRANT_TYPE=password
  CLIENT_ID=admin-cli
  REALM=lagoon
  USER=admin-lagoon
  USERROLE=admin-role.json

  access_token=$( curl -d "client_id=$CLIENT_ID" -d "username=$KEYCLOAK_ADMIN_USER" -d "password=$KEYCLOAK_ADMIN_PASSWORD" -d "grant_type=$GRANT_TYPE" "$KEYCLOAK_URL/auth/realms/master/protocol/openid-connect/token" | jq -r '. | .access_token')


  # Get admin user and extract user id
  USERID=$(curl -H "Content-Type: application/json" -H "Authorization: Bearer $access_token" "$KEYCLOAK_URL/auth/admin/realms/$REALM/users" | jq -r '.[] | select(.username == "admin-lagoon") | .id' )
  echo "------------------------------------------------------------------------"
  echo "User ID for '$USER': $USERID"
  echo "------------------------------------------------------------------------"

  echo "get admin role id"
  ADMIN_ROLE_ID=$(curl -H "Content-Type: application/json" -H "Authorization: Bearer $access_token" "$KEYCLOAK_URL/auth/admin/realms/$REALM/roles" | jq -r '.[] | select(.name == "admin") | .id' )
  echo $ADMIN_ROLE_ID

  jq -n --arg id "$ADMIN_ROLE_ID" '[{ id: $id, name: "admin" }]' > admin-role.json

  # Map role
  result=$(curl -d @./$USERROLE -H "Content-Type: application/json" -H "Authorization: Bearer $access_token" "$KEYCLOAK_URL/auth/admin/realms/$REALM/users/$USERID/role-mappings/realm")

  if [ "$result" = "" ]; then
  echo "------------------------------------------------------------------------"
  echo "The user: $USER roles are updated."
  echo "Open following link in your browser:"
  echo "$KEYCLOAK_URL/auth/admin/master/console/#/realms/$REALM"
  echo "------------------------------------------------------------------------"
  else
  echo "------------------------------------------------------------------------"
  echo "It seems there is a problem with the user role mapping: $result"
  echo "------------------------------------------------------------------------"
  fi
}

#add_admin_user_query
#map_user_role_keycloak

## setup lagoon cli
lagoon config add \
  --lagoon e2e \
  --hostname lagoon-core-ssh \
  --graphql http://lagoon-core-api:80/graphql \
  --port 2020 \
  --token $(./create_jwt.py) \
  --ui http://lagoon-core-ui \
  --force

lagoon config delete -l amazeeio --force
lagoon config default -l e2e

## create default lagoon user and group
lagoon add user -E ci-customer-user-rsa@example.com
lagoon add user-sshkey -E ci-customer-user-rsa@example.com -N "ci-customer-sshkey-rsa" -V "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnjrzKVPSqmqO1Xg5K4LOX4/9N4n4qkLEOiqnzzJClhFif3O28RW86RPxERGdPT81UI0oDAcU5euQr8Emz+Hd+PY1115UIld3CIHib5PYL9Ee0bFUKiWpR/acSe1fHB64mCoHP7hjFepGsq7inkvg2651wUDKBshGltpNkMj6+aZedNc0/rKYyjl80nT8g8QECgOSRzpmYp0zli2HpFoLOiWw=="
lagoon add group -N ci-group
lagoon add user-group -N ci-group -E ci-customer-user-rsa@example.com -R owner

exec "$@"

# debug - keep container running
#tail -f /dev/null