#!/bin/bash

CONFIG_PATH=/tmp/kcadm.config
KCADM=/opt/keycloak/bin/kcadm.sh
REALM=lagoon

# ENFORCE_MFA=true  - every user must use a passkey or OTP; users with neither are made to set up OTP
# ENFORCE_MFA=false - passkey/OTP are only asked for if the user has set one up themselves
ENFORCE_MFA=${ENFORCE_MFA:-true}
if [ "$ENFORCE_MFA" != "true" ] && [ "$ENFORCE_MFA" != "false" ]; then
    echo "ENFORCE_MFA must be true or false, got: $ENFORCE_MFA"
    exit 1
fi

if ! $KCADM config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --realm master --client admin-api --secret ${KEYCLOAK_ADMIN_API_CLIENT_SECRET}
then
if ! $KCADM config credentials --config $CONFIG_PATH --server http://localhost:8080/auth --user $KEYCLOAK_ADMIN_USER --password $KEYCLOAK_ADMIN_PASSWORD --realm master
then
    echo "Unable to log in to keycloak with client admin-api or username and password"
    echo "If you have rotated the admin-api secret, you will need to log in and update it manually"
    exit 1
fi
fi
kc() {
    $KCADM "$@" -r "$REALM" --config $CONFIG_PATH
}

add_execution() {
    local id
    id=$(kc create "authentication/flows/$1/executions/execution" -i -b '{"provider" : "'"$2"'"}')
    kc update "authentication/flows/$1/executions" -b '{"id":"'"$id"'","priority":'"$3"',"requirement":"'"$4"'"}' >/dev/null
    echo "$id"
}

add_subflow() {
    local flow_id exec_id
    flow_id=$(kc create "authentication/flows/$1/executions/flow" -i -b '{"alias" : "'"$2"'" , "type" : "basic-flow"}')
    exec_id=$(kc get "authentication/flows/$1/executions" --fields id,flowId | jq -r '.[] | select(.flowId==("'"$flow_id"'")) | .id')
    kc update "authentication/flows/$1/executions" -b '{"id":"'"$exec_id"'","priority":'"$3"',"requirement":"'"$4"'"}' >/dev/null
    echo "$exec_id"
}

# 2FA: passkey (webauthn) if the user has one registered, otherwise OTP.
#
# The branches sit directly in the forms sub-flow, next to the Username Password Form, so that
# when both branches are skipped (ENFORCE_MFA=false, user has neither) the forms sub-flow still
# succeeds. Wrapping them in their own REQUIRED sub-flow fails the login in that case, because
# the wrapper has nothing it can run.
#
# Browser-HomeIDP-Forms
# ├─ Username Password Form                REQUIRED
# ├─ Browser-HomeIDP-2FA-Passkey           CONDITIONAL
# │   ├─ Condition - user configured       REQUIRED
# │   └─ WebAuthn Authenticator            REQUIRED
# └─ Browser-HomeIDP-2FA-OTP               CONDITIONAL
#     ├─ Condition - credential            REQUIRED  (webauthn NOT used in this login)
#     ├─ Condition - user configured       REQUIRED  (ENFORCE_MFA=false only: user has OTP set up)
#     └─ OTP Form                          REQUIRED  (with ENFORCE_MFA=true, forces OTP setup if not configured)
create_2fa_flow() {
    echo "Creating 2FA sub-flows (ENFORCE_MFA=$ENFORCE_MFA)"

    # passkey branch: only runs if the user has a webauthn credential
    add_subflow Browser-HomeIDP-Forms Browser-HomeIDP-2FA-Passkey 1 CONDITIONAL >/dev/null
    add_execution Browser-HomeIDP-2FA-Passkey conditional-user-configured 0 REQUIRED >/dev/null
    add_execution Browser-HomeIDP-2FA-Passkey webauthn-authenticator 1 REQUIRED >/dev/null

    # otp branch: only runs if webauthn was not used earlier in this login
    add_subflow Browser-HomeIDP-Forms Browser-HomeIDP-2FA-OTP 2 CONDITIONAL >/dev/null
    local cond_id
    cond_id=$(add_execution Browser-HomeIDP-2FA-OTP conditional-credential 0 REQUIRED)
    kc create "authentication/executions/$cond_id/config" \
        -b '{"alias":"homeidp-2fa-webauthn-not-used","config":{"credentials":"webauthn","included":"false"}}' >/dev/null
    if [ "$ENFORCE_MFA" == "false" ]; then
        # not enforced: only ask for OTP if the user has already set it up
        add_execution Browser-HomeIDP-2FA-OTP conditional-user-configured 1 REQUIRED >/dev/null
    fi
    add_execution Browser-HomeIDP-2FA-OTP auth-otp-form 2 REQUIRED >/dev/null
}

# prints the 2FA layout currently configured on the realm:
#   true / false - current layout, with that ENFORCE_MFA setting
#   legacy       - an older layout (Browser-HomeIDP-2FA wrapper or Browser-HomeIDP-Conditional2FA)
#   none         - no 2FA sub-flows
current_2fa_mode() {
    local forms_executions
    forms_executions=$(kc get authentication/flows/Browser-HomeIDP-Forms/executions)
    if [ "$(echo "$forms_executions" | jq -r '.[] | select(.level==0 and (.displayName==("Browser-HomeIDP-2FA") or .displayName==("Browser-HomeIDP-Conditional2FA"))) | .id')" != "" ]; then
        echo "legacy"
    elif [ "$(echo "$forms_executions" | jq -r '.[] | select(.level==0 and .displayName==("Browser-HomeIDP-2FA-OTP")) | .id')" == "" ]; then
        echo "none"
    elif [ "$(kc get authentication/flows/Browser-HomeIDP-2FA-OTP/executions | jq -r '.[] | select(.providerId==("conditional-user-configured")) | .id')" != "" ]; then
        echo "false"
    else
        echo "true"
    fi
}

# removes all 2FA sub-flows (current and older layouts) from the forms sub-flow
remove_2fa_flow() {
    local forms_executions id
    forms_executions=$(kc get authentication/flows/Browser-HomeIDP-Forms/executions)
    for id in $(echo "$forms_executions" | jq -r '.[] | select(.level==0 and (.displayName | IN("Browser-HomeIDP-2FA", "Browser-HomeIDP-2FA-Passkey", "Browser-HomeIDP-2FA-OTP", "Browser-HomeIDP-Conditional2FA"))) | .id'); do
        echo "Removing existing 2FA sub-flow execution $id"
        kc delete "authentication/executions/$id"
    done
}

if [ "$(kc get authentication/flows --fields id,alias | jq -r '.[] | select(.alias==("Browser-HomeIDP")) | .id')" == "" ]; then
    echo "Creating browser flow for homeidp"
    kc create authentication/flows -s alias="Browser-HomeIDP" -s providerId=basic-flow -s topLevel=true -s builtIn=false

    add_execution Browser-HomeIDP auth-cookie 0 ALTERNATIVE >/dev/null
    add_execution Browser-HomeIDP identity-provider-redirector 1 ALTERNATIVE >/dev/null

    EXECUTION_ID=$(add_execution Browser-HomeIDP home-idp-discovery 2 ALTERNATIVE)
    # the forwardUnverifiedEmail":"true","forwardToLinkedIdp":"true" need to be set or else the idp user will be prompted for their lagoon realm user/pass after their first login
    kc create "authentication/executions/$EXECUTION_ID/config" \
        -b '{"alias":"homeidpalias","config":{"default.reference.value":"","default.reference.maxAge":"","bypassLoginPage":false,"forwardToFirstMatch":true,"userAttribute":"email","forwardUnverifiedEmail":"true","forwardToLinkedIdp":"true"}}'

    add_subflow Browser-HomeIDP Browser-HomeIDP-Forms 3 ALTERNATIVE >/dev/null
    add_execution Browser-HomeIDP-Forms auth-username-password-form 0 REQUIRED >/dev/null

    create_2fa_flow

    add_execution Browser-HomeIDP auth-spnego 4 DISABLED >/dev/null

    echo "Set the realm to use the new homeidp browserflow"
    $KCADM update realms/lagoon -s browserFlow=Browser-HomeIDP --config $CONFIG_PATH

    echo "Delete webauthn-register required action, this may report resource not found which is fine to ignore"
    kc delete authentication/required-actions/webauthn-register

    echo "Register webauthn-register required action"
    kc create authentication/register-required-action \
        -s providerId=webauthn-register \
        -s name="Webauthn Register"
else
    echo "Browser flow for homeidp already created"

    # rebuild the 2FA sub-flow if it is missing (older installs) or ENFORCE_MFA has changed
    CURRENT_MODE=$(current_2fa_mode)
    if [ "$CURRENT_MODE" != "$ENFORCE_MFA" ]; then
        echo "2FA sub-flow is '$CURRENT_MODE', want ENFORCE_MFA=$ENFORCE_MFA, rebuilding"
        remove_2fa_flow
        create_2fa_flow
    else
        echo "2FA sub-flow already configured with ENFORCE_MFA=$ENFORCE_MFA"
    fi
fi

# hide the ssorealm identity provider from the login page, if it exists
if [ "$(kc get identity-provider/instances --fields alias | jq -r '.[] | select(.alias==("ssorealm")) | .alias')" != "" ]; then
    echo "Setting hide on login page for identity provider ssorealm"
    # hideOnLogin is the top-level field in Keycloak 26+, config.hideOnLoginPage is the older location
    kc update identity-provider/instances/ssorealm -s hideOnLogin=true -s 'config.hideOnLoginPage=true'
else
    echo "Identity provider ssorealm not found, skipping hide on login page"
fi