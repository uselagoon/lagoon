#!/bin/bash
# Wrapper script as docker entrypoint to run initialize-my-realm.sh in parallel to actual kc.sh (the official entrypoint).

set -e -u -o pipefail
shopt -s failglob

/opt/keycloak/startup-scripts/00-configure-lagoon.sh & disown

/opt/keycloak/bin/kc.sh "$@" --features="scripts,token-exchange,admin-fine-grained-authz"