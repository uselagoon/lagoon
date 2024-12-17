#!/bin/bash

CONFIG_PATH=/tmp/kcadm.config
if ! /opt/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --realm master --client admin-api --secret ${KEYCLOAK_ADMIN_API_CLIENT_SECRET}
then
if ! /opt/keycloak/bin/kcadm.sh config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD --realm master
then
    echo "Unable to log in to keycloak with client admin-api or username and password"
    echo "If you have rotated the admin-api secret, you will need to log in and update it manually"
    exit 1
fi
fi

if [ "$(/opt/keycloak/bin/kcadm.sh get authentication/flows -r "lagoon" --fields id,alias --config $CONFIG_PATH | jq -r '.[] | select(.alias==("Browser-Webauthn")) | .id')" == "" ]; then
    echo "Creating browser flow for webauthn"
    /opt/keycloak/bin/kcadm.sh create authentication/flows -r "lagoon" -s alias="Browser-Webauthn" -s providerId=basic-flow -s topLevel=true -s builtIn=false --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn/executions/execution -i -b '{"provider" : "auth-cookie"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"ALTERNATIVE"}' -r "lagoon" --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn/executions/execution -i -b '{"provider" : "auth-spnego"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"DISABLED"}' -r "lagoon" --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn/executions/execution -i -b '{"provider" : "identity-provider-redirector"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"ALTERNATIVE"}' -r "lagoon" --config $CONFIG_PATH

    FLOW_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn/executions/flow -i -r "lagoon" -b '{"alias" : "Browser-Webauthn-Forms" , "type" : "basic-flow"}' --config $CONFIG_PATH)
    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh get authentication/flows/Browser-Webauthn/executions -r "lagoon" --fields id,flowId,alias --config $CONFIG_PATH | jq -r '.[] | select(.flowId==("'"$FLOW_ID"'")) | .id')
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn/executions -r "lagoon" -b '{"id":"'"$EXECUTION_ID"'","requirement":"ALTERNATIVE"}' --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn-Forms/executions/execution -i -b '{"provider" : "auth-username-password-form"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn-Forms/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"REQUIRED"}' -r "lagoon" --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn-Forms/executions/execution -i -b '{"provider" : "webauthn-authenticator"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn-Forms/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"ALTERNATIVE"}' -r "lagoon" --config $CONFIG_PATH

    FLOW_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn-Forms/executions/flow -i -r "lagoon" -b '{"alias" : "Browser-Webauthn-Conditional2FA" , "type" : "basic-flow"}' --config $CONFIG_PATH)
    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh get authentication/flows/Browser-Webauthn-Forms/executions -r "lagoon" --fields id,flowId,alias --config $CONFIG_PATH | jq -r '.[] | select(.flowId==("'"$FLOW_ID"'")) | .id')
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn-Forms/executions -r "lagoon" -b '{"id":"'"$EXECUTION_ID"'","requirement":"CONDITIONAL"}' --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn-Conditional2FA/executions/execution -i -b '{"provider" : "conditional-user-configured"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn-Conditional2FA/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"REQUIRED"}' -r "lagoon" --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn-Conditional2FA/executions/execution -i -b '{"provider" : "webauthn-authenticator"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn-Conditional2FA/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"ALTERNATIVE"}' -r "lagoon" --config $CONFIG_PATH

    EXECUTION_ID=$(/opt/keycloak/bin/kcadm.sh create authentication/flows/Browser-Webauthn-Conditional2FA/executions/execution -i -b '{"provider" : "auth-otp-form"}' -r "lagoon" --config $CONFIG_PATH)
    /opt/keycloak/bin/kcadm.sh update authentication/flows/Browser-Webauthn-Conditional2FA/executions -b '{"id":"'"$EXECUTION_ID"'","requirement":"ALTERNATIVE"}' -r "lagoon" --config $CONFIG_PATH

    echo "Set the realm to use the new webauthn browserflow"
    /opt/keycloak/bin/kcadm.sh update realms/lagoon -s browserFlow=Browser-Webauthn --config $CONFIG_PATH

    echo "Delete webauthn-register required action, this may report resource not found which is fine to ignore"
    /opt/keycloak/bin/kcadm.sh delete authentication/required-actions/webauthn-register -r lagoon --config $CONFIG_PATH

    echo "Register webauthn-register required action"
    /opt/keycloak/bin/kcadm.sh create authentication/register-required-action -r lagoon \
        -s providerId=webauthn-register \
        -s name="Webauthn Register" \
        --config $CONFIG_PATH
else
    echo "Browser flow for webauthn already created"
fi