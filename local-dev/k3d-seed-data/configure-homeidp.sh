#!/bin/bash

CONFIG_PATH=/tmp/kcadm.config
KCADM=/opt/keycloak/bin/kcadm.sh
REALM=lagoon

# ENFORCE_MFA=true  - every user must use a passkey or OTP; those with neither are made to set up OTP,
#                     except users with the realm role mfa-exemption
# ENFORCE_MFA=false - passkey/OTP are only asked for if the user has set one up themselves
# MFA_USE_REALM_ROLE=true  - only used with ENFORCE_MFA=false: users with the realm role mfa-required must also use
#                            a passkey or OTP (made to set up OTP if they have neither). Everyone else is as ENFORCE_MFA=false
#                            (the role is created by this script but not assigned to any user)
# MFA_USE_REALM_ROLE=false - no per-user enforcement
# USE_HOMEIDP=true  - the browser flow includes the home idp discovery (redirect users to their idp by email domain)
#                     and the ssorealm identity provider is hidden from the login page
# USE_HOMEIDP=false - a standard browser flow (cookie, identity provider redirector, username/password) with the same
#                     MFA handling, and without the home idp discovery or hiding of the ssorealm identity provider
ENFORCE_MFA=${ENFORCE_MFA:-true}
USE_HOMEIDP=${USE_HOMEIDP:-true}
MFA_USE_REALM_ROLE=${MFA_USE_REALM_ROLE:-false}

if [ "$USE_HOMEIDP" != "true" ] && [ "$USE_HOMEIDP" != "false" ]; then
    echo "USE_HOMEIDP must be true or false, got: $USE_HOMEIDP"
    exit 1
fi
if [ "$MFA_USE_REALM_ROLE" != "true" ] && [ "$MFA_USE_REALM_ROLE" != "false" ]; then
    echo "MFA_USE_REALM_ROLE must be true or false, got: $MFA_USE_REALM_ROLE"
    exit 1
fi
if [ "$ENFORCE_MFA" == "false" ] && [ "$MFA_USE_REALM_ROLE" == "true" ]; then
    DESIRED_MODE="role"
elif [ "$ENFORCE_MFA" == "true" ]; then
    DESIRED_MODE="exempt"
else
    DESIRED_MODE="false"
fi
if [ "$ENFORCE_MFA" != "true" ] && [ "$ENFORCE_MFA" != "false" ]; then
    echo "ENFORCE_MFA must be true or false, got: $ENFORCE_MFA"
    exit 1
fi
if [ "$ENFORCE_MFA" == "true" ] && [ "$MFA_USE_REALM_ROLE" == "true" ]; then
    echo "MFA_USE_REALM_ROLE has no effect with ENFORCE_MFA=true, all users are enforced except those with the mfa-exemption role"
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

# adds the home idp discovery execution to the top level browser flow
add_homeidp_discovery() {
    local execution_id
    execution_id=$(add_execution Browser-LagoonLogin home-idp-discovery 2 ALTERNATIVE)
    # the forwardUnverifiedEmail":"true","forwardToLinkedIdp":"true" need to be set or else the idp user will be prompted for their lagoon realm user/pass after their first login
    kc create "authentication/executions/$execution_id/config"         -b '{"alias":"homeidpalias","config":{"default.reference.value":"","default.reference.maxAge":"","bypassLoginPage":false,"forwardToFirstMatch":true,"userAttribute":"email","forwardUnverifiedEmail":"true","forwardToLinkedIdp":"true"}}'
}

# adds or removes the home idp discovery execution so the flow matches USE_HOMEIDP
reconcile_homeidp_discovery() {
    local discovery_id
    discovery_id=$(kc get authentication/flows/Browser-LagoonLogin/executions | jq -r '.[] | select(.providerId=="home-idp-discovery") | .id')
    if [ "$USE_HOMEIDP" == "true" ] && [ "$discovery_id" == "" ]; then
        echo "Adding home idp discovery to the browser flow"
        add_homeidp_discovery
    elif [ "$USE_HOMEIDP" == "false" ] && [ "$discovery_id" != "" ]; then
        echo "Removing home idp discovery from the browser flow"
        kc delete "authentication/executions/$discovery_id"
    else
        echo "Home idp discovery already matches USE_HOMEIDP=$USE_HOMEIDP"
    fi
}

# 2FA: passkey (webauthn) if the user has one registered, otherwise OTP.
#
# The branches sit directly in the forms sub-flow, next to the Username Password Form, so that
# when both branches are skipped (ENFORCE_MFA=false, user has neither) the forms sub-flow still
# succeeds. Wrapping them in their own REQUIRED sub-flow fails the login in that case, because
# the wrapper has nothing it can run.
#
# Browser-LagoonLogin-Forms
# ├─ Username Password Form                REQUIRED
# ├─ Browser-LagoonLogin-2FA-Passkey      CONDITIONAL
# │   ├─ Condition - user configured       REQUIRED
# │   └─ WebAuthn Authenticator            REQUIRED
# ├─ Browser-LagoonLogin-2FA-OTP          CONDITIONAL
#     ├─ Condition - credential            REQUIRED  (webauthn NOT used in this login)
#     ├─ Condition - user configured       REQUIRED  (ENFORCE_MFA=false only: user has OTP set up)
#     ├─ Condition - user role (negated)   REQUIRED  (ENFORCE_MFA=true only: user does NOT have realm role mfa-exemption)
#     └─ OTP Form                          REQUIRED  (with ENFORCE_MFA=true, forces OTP setup if not configured)
# └─ Browser-LagoonLogin-2FA-OTP-Role     CONDITIONAL  (ENFORCE_MFA=false and MFA_USE_REALM_ROLE=true only)
#     ├─ Condition - credential            REQUIRED  (webauthn NOT used in this login)
#     ├─ Condition - user role             REQUIRED  (user has realm role mfa-required)
#     ├─ Condition - user configured (negated) REQUIRED  (user has no OTP yet, users with OTP are handled by the branch above)
#     └─ OTP Form                          REQUIRED  (forces OTP setup)
create_2fa_flow() {
    echo "Creating 2FA sub-flows (ENFORCE_MFA=$ENFORCE_MFA)"

    # passkey branch: only runs if the user has a webauthn credential
    add_subflow Browser-LagoonLogin-Forms Browser-LagoonLogin-2FA-Passkey 1 CONDITIONAL >/dev/null
    add_execution Browser-LagoonLogin-2FA-Passkey conditional-user-configured 0 REQUIRED >/dev/null
    add_execution Browser-LagoonLogin-2FA-Passkey webauthn-authenticator 1 REQUIRED >/dev/null

    # otp branch: only runs if webauthn was not used earlier in this login
    add_subflow Browser-LagoonLogin-Forms Browser-LagoonLogin-2FA-OTP 2 CONDITIONAL >/dev/null
    local cond_id
    cond_id=$(add_execution Browser-LagoonLogin-2FA-OTP conditional-credential 0 REQUIRED)
    kc create "authentication/executions/$cond_id/config" \
        -b '{"alias":"homeidp-2fa-webauthn-not-used","config":{"credentials":"webauthn","included":"false"}}' >/dev/null
    if [ "$ENFORCE_MFA" == "false" ]; then
        # not enforced: only ask for OTP if the user has already set it up
        add_execution Browser-LagoonLogin-2FA-OTP conditional-user-configured 1 REQUIRED >/dev/null
    else
        # enforced: everyone except users with the mfa-exemption realm role
        local exempt_id
        exempt_id=$(add_execution Browser-LagoonLogin-2FA-OTP conditional-user-role 1 REQUIRED)
        kc create "authentication/executions/$exempt_id/config" -b '{"alias":"homeidp-2fa-mfa-exemption","config":{"condUserRole":"mfa-exemption","negate":"true"}}' >/dev/null
    fi
    add_execution Browser-LagoonLogin-2FA-OTP auth-otp-form 2 REQUIRED >/dev/null

    if [ "$DESIRED_MODE" == "role" ]; then
        # users with the mfa-required realm role must have OTP, forced to set it up if they have none
        add_subflow Browser-LagoonLogin-Forms Browser-LagoonLogin-2FA-OTP-Role 3 CONDITIONAL >/dev/null
        local role_cond_id role_id configured_id
        role_cond_id=$(add_execution Browser-LagoonLogin-2FA-OTP-Role conditional-credential 0 REQUIRED)
        kc create "authentication/executions/$role_cond_id/config"             -b '{"alias":"homeidp-2fa-role-webauthn-not-used","config":{"credentials":"webauthn","included":"false"}}' >/dev/null
        role_id=$(add_execution Browser-LagoonLogin-2FA-OTP-Role conditional-user-role 1 REQUIRED)
        kc create "authentication/executions/$role_id/config"             -b '{"alias":"homeidp-2fa-mfa-required","config":{"condUserRole":"mfa-required","negate":"false"}}' >/dev/null
        configured_id=$(add_execution Browser-LagoonLogin-2FA-OTP-Role conditional-user-configured 2 REQUIRED)
        kc create "authentication/executions/$configured_id/config"             -b '{"alias":"homeidp-2fa-role-otp-not-configured","config":{"negate":"true"}}' >/dev/null
        add_execution Browser-LagoonLogin-2FA-OTP-Role auth-otp-form 3 REQUIRED >/dev/null
    fi
}

# prints the 2FA layout currently configured on the realm:
#   exempt / false / role - current layout (exempt = ENFORCE_MFA=true with the mfa-exemption role; role = false plus the mfa-required role branch)
#   legacy       - an older layout (Browser-LagoonLogin-2FA wrapper, Browser-LagoonLogin-Conditional2FA)
#   none         - no 2FA sub-flows
current_2fa_mode() {
    local forms_executions
    forms_executions=$(kc get authentication/flows/Browser-LagoonLogin-Forms/executions)
    if [ "$(echo "$forms_executions" | jq -r '.[] | select(.level==0 and (.displayName==("Browser-LagoonLogin-2FA") or .displayName==("Browser-LagoonLogin-Conditional2FA"))) | .id')" != "" ]; then
        echo "legacy"
    elif [ "$(echo "$forms_executions" | jq -r '.[] | select(.level==0 and .displayName==("Browser-LagoonLogin-2FA-OTP")) | .id')" == "" ]; then
        echo "none"
    elif [ "$(kc get authentication/flows/Browser-LagoonLogin-2FA-OTP/executions | jq -r '.[] | select(.providerId==("conditional-user-role")) | .id')" != "" ]; then
        if kc get authentication/flows/Browser-LagoonLogin-2FA-OTP/executions | jq -r '.[] | select(.providerId=="conditional-user-role") | .authenticationConfig' | while read -r cfg; do kc get "authentication/config/$cfg"; done | grep -q mfa-exemption; then
            echo "exempt"
        else
            echo "legacy"
        fi
    elif [ "$(echo "$forms_executions" | jq -r '.[] | select(.level==0 and .displayName==("Browser-LagoonLogin-2FA-OTP-Role")) | .id')" != "" ]; then
        echo "role"
    elif [ "$(kc get authentication/flows/Browser-LagoonLogin-2FA-OTP/executions | jq -r '.[] | select(.providerId==("conditional-user-configured")) | .id')" != "" ]; then
        echo "false"
    elif [ "$(kc get authentication/flows/Browser-LagoonLogin-2FA-OTP/executions | jq -r '.[] | select(.providerId==("auth-otp-form")) | .id')" != "" ]; then
        echo "true"
    else
        echo "legacy"
    fi
}

# creates the mfa-required realm role if it does not exist (not assigned to any user)
ensure_mfa_role() {
    if [ "$(kc get roles --fields name | jq -r '.[] | select(.name=="mfa-required") | .name')" != "" ]; then
        echo "Realm role mfa-required already exists"
        return
    fi
    echo "Creating realm role mfa-required"
    kc create roles -s name=mfa-required -s 'description=Users with this role must use a passkey or OTP when ENFORCE_MFA=false and MFA_USE_REALM_ROLE=true'
}

ensure_mfa_exemption_role() {
    if [ "$(kc get roles --fields name | jq -r '.[] | select(.name=="mfa-exemption") | .name')" != "" ]; then
        echo "Realm role mfa-exemption already exists"
        return
    fi
    echo "Creating realm role mfa-exemption"
    kc create roles -s name=mfa-exemption -s 'description=Users with this role are exempt from MFA when ENFORCE_MFA=true'
}

# removes all 2FA sub-flows (current and older layouts) from the forms sub-flow
remove_2fa_flow() {
    local forms_executions id
    forms_executions=$(kc get authentication/flows/Browser-LagoonLogin-Forms/executions)
    for id in $(echo "$forms_executions" | jq -r '.[] | select(.level==0 and (.displayName | IN("Browser-LagoonLogin-2FA", "Browser-LagoonLogin-2FA-Passkey", "Browser-LagoonLogin-2FA-OTP", "Browser-LagoonLogin-2FA-OTP-Role", "Browser-LagoonLogin-Conditional2FA"))) | .id'); do
        echo "Removing existing 2FA sub-flow execution $id"
        kc delete "authentication/executions/$id"
    done
}

ensure_mfa_role
ensure_mfa_exemption_role

if [ "$(kc get authentication/flows --fields id,alias | jq -r '.[] | select(.alias==("Browser-LagoonLogin")) | .id')" == "" ]; then
    echo "Creating browser flow for homeidp"
    kc create authentication/flows -s alias="Browser-LagoonLogin" -s providerId=basic-flow -s topLevel=true -s builtIn=false

    add_execution Browser-LagoonLogin auth-cookie 0 ALTERNATIVE >/dev/null
    add_execution Browser-LagoonLogin identity-provider-redirector 1 ALTERNATIVE >/dev/null

    if [ "$USE_HOMEIDP" == "true" ]; then
        add_homeidp_discovery
    fi

    add_subflow Browser-LagoonLogin Browser-LagoonLogin-Forms 3 ALTERNATIVE >/dev/null
    add_execution Browser-LagoonLogin-Forms auth-username-password-form 0 REQUIRED >/dev/null

    create_2fa_flow

    add_execution Browser-LagoonLogin auth-spnego 4 DISABLED >/dev/null

    echo "Set the realm to use the new homeidp browserflow"
    $KCADM update realms/lagoon -s browserFlow=Browser-LagoonLogin --config $CONFIG_PATH

    echo "Delete webauthn-register required action, this may report resource not found which is fine to ignore"
    kc delete authentication/required-actions/webauthn-register

    echo "Register webauthn-register required action"
    kc create authentication/register-required-action \
        -s providerId=webauthn-register \
        -s name="Webauthn Register"
else
    echo "Browser flow for homeidp already created"

    reconcile_homeidp_discovery

    # rebuild the 2FA sub-flow if it is missing (older installs) or ENFORCE_MFA has changed
    CURRENT_MODE=$(current_2fa_mode)
    if [ "$CURRENT_MODE" != "$DESIRED_MODE" ]; then
        echo "2FA sub-flow is '$CURRENT_MODE', want ENFORCE_MFA=$ENFORCE_MFA MFA_USE_REALM_ROLE=$MFA_USE_REALM_ROLE, rebuilding"
        remove_2fa_flow
        create_2fa_flow
    else
        echo "2FA sub-flow already configured with ENFORCE_MFA=$ENFORCE_MFA MFA_USE_REALM_ROLE=$MFA_USE_REALM_ROLE"
    fi
fi

# hide the ssorealm identity provider from the login page (USE_HOMEIDP=true), or show it again (USE_HOMEIDP=false), if it exists
if [ "$(kc get identity-provider/instances --fields alias | jq -r '.[] | select(.alias==("ssorealm")) | .alias')" != "" ]; then
    echo "Setting hide on login page for identity provider ssorealm to $USE_HOMEIDP"
    # hideOnLogin is the top-level field in Keycloak 26+, config.hideOnLoginPage is the older location
    kc update identity-provider/instances/ssorealm -s hideOnLogin=$USE_HOMEIDP -s "config.hideOnLoginPage=$USE_HOMEIDP"
else
    echo "Identity provider ssorealm not found, skipping hide on login page"
fi
