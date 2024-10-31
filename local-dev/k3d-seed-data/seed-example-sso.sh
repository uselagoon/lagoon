#!/bin/bash

CONFIG_PATH=/tmp/kcadm.config

# login to keycloak
/opt/keycloak/bin/kcadm.sh config credentials \
  --config $CONFIG_PATH --server http://localhost:8080/auth \
  --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD \
  --realm master

if /opt/keycloak/bin/kcadm.sh get realms/sso --config $CONFIG_PATH > /dev/null; then
    echo "Realm sso is already created, skipping"
    exit 0
fi

# create the SSO realm
echo "Creating new sso realm"
/opt/keycloak/bin/kcadm.sh create realms --config $CONFIG_PATH -s realm=sso -s enabled=true

# Create a user in the SSO realm

echo "Creating user and configuring password for user@sso.example.com"
/opt/keycloak/bin/kcadm.sh create users -r sso \
   -s email=user@sso.example.com \
   -s firstName=sso \
   -s lastName=user \
   -s username=sso-user \
   -s enabled=true \
   -o --fields id,username \
   --config $CONFIG_PATH

# Set the password for the SSO user
/opt/keycloak/bin/kcadm.sh set-password \
   --config $CONFIG_PATH \
   --username sso-user \
   -p user@sso.example.com \
   --target-realm sso

# create the SSO realm OIDC client
echo "Creating example client in sso realm"
echo '{"clientId": "sso-oidc-client", "publicClient": false, "webOrigins": ["*"], "redirectUris": ["*"]}' | /opt/keycloak/bin/kcadm.sh create clients --config $CONFIG_PATH -r sso -f -
CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get  -r sso clients?clientId=sso-oidc-client --config $CONFIG_PATH | jq -r '.[0]["id"]')
echo '{"protocol":"openid-connect","config":{"id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true","user.attribute":"lagoon-uid","claim.name":"lagoon.user_id","jsonType.label":"int","multivalued":""},"name":"Lagoon User ID","protocolMapper":"oidc-usermodel-attribute-mapper"}' | /opt/keycloak/bin/kcadm.sh create -r sso clients/$CLIENT_ID/protocol-mappers/models --config $CONFIG_PATH -f -
/opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID -s secret=123456789 --config $CONFIG_PATH -r sso


# create the IDP in the Lagoon realm linking to the SSO OIDC client
echo "Creating ssorealm identity provider in lagoon realm"
/opt/keycloak/bin/kcadm.sh create identity-provider/instances -s enabled=true \
  -s displayName=ssorealm \
  -s alias=ssorealm \
  -s providerId=oidc \
  -s config.authorizationUrl=${KEYCLOAK_FRONTEND_URL%/}/realms/sso/protocol/openid-connect/auth \
  -s config.tokenUrl=http://localhost:8080/auth/realms/sso/protocol/openid-connect/token \
  -s config.logoutUrl=${KEYCLOAK_FRONTEND_URL%/}/realms/sso/protocol/openid-connect/logout \
  -s config.userInfoUrl=http://localhost:8080/auth/realms/sso/protocol/openid-connect/userinfo \
  -s config.issuer=${KEYCLOAK_FRONTEND_URL%/}/realms/sso \
  -s config.validateSignature=true \
  -s config.pkceEnabled=false \
  -s config.clientAuthMethod=client_secret_post \
  -s config.clientId=sso-oidc-client \
  -s config.clientSecret=123456789 \
  -s config.metadataDescriptorUrl=http://localhost:8080/auth/realms/sso/.well-known/openid-configuration \
  -s config.jwksUrl=http://localhost:8080/auth/realms/sso/protocol/openid-connect/certs \
  -s config.useJwksUrl=true --config $CONFIG_PATH -r lagoon

# create a role mapper that grants any users from the SSO realm as platform-owner
echo "Configuring ssorealm identity provider with platform-owner role mapping"
/opt/keycloak/bin/kcadm.sh create identity-provider/instances/ssorealm/mappers \
   -s name=platform-owner \
   -s identityProviderMapper=oidc-hardcoded-role-idp-mapper  \
   -s identityProviderAlias=ssorealm \
   -s config.syncMode=FORCE \
   -s config.role=platform-owner \
    --config $CONFIG_PATH -r lagoon