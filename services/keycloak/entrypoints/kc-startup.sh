#!/bin/bash
# Wrapper script as docker entrypoint to run initialize-my-realm.sh in parallel to actual kc.sh (the official entrypoint).

set -e -u -o pipefail
shopt -s failglob

/opt/keycloak/startup-scripts/00-configure-lagoon.sh & disown

# https://www.keycloak.org/docs/latest/upgrading/#new-hostname-options
# https://www.keycloak.org/server/hostname
# "--hostname-backchannel-dynamic"
# Enables dynamic resolving of backchannel URLs, including hostname, scheme, port and context path.
# Set to true if your application accesses Keycloak via a private network. If set to true, hostname option needs to be specified as a full URL.
/opt/keycloak/bin/kc.sh "$@" --features="scripts,token-exchange,admin-fine-grained-authz" \
    --hostname-backchannel-dynamic true --hostname ${KC_HOSTNAME_URL}