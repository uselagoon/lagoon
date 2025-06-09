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

# https://www.keycloak.org/server/hostname#_using_edge_tls_termination replaces `KC_PROXY=edge`
# --proxy-headers xforwarded
# --http-enabled

# it is also possible to expose the admin console on a different hostname using the `--hostname-admin` flag, which could support in the future with a different
# variable than `KEYCLOAK_FRONTEND_URL` perhaps `KEYCLOAK_ADMIN_URL`
/opt/keycloak/bin/kc.sh "$@" --features="scripts,token-exchange:v1,admin-fine-grained-authz:v1" \
    --proxy-headers xforwarded \
    --http-enabled true \
    --http-relative-path ${KC_HTTP_RELATIVE_PATH:-/auth} \
    --hostname-backchannel-dynamic true \
    --hostname-strict ${KC_HOSTNAME_STRICT:-false} \
    --hostname ${KEYCLOAK_FRONTEND_URL} \
    --hostname-admin ${KEYCLOAK_FRONTEND_URL}
