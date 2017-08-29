#!/bin/bash

export SSH_AUTH_HOST=localhost
export SSH_AUTH_PORT="2020"
export SSH_AUTH_USER="api"
export API_URL="http://localhost:3000/graphql"

# Set the identity option to the local private key for the `login` and `logout`
# commands unless the option is already set.
if [[ $@ =~ login|logout && ! $@ =~ ^.*(--identity\ |-i\ ).*$ ]]; then
  ARGS="--identity $(dirname "${BASH_SOURCE[0]}")/local/cli_id_rsa"
fi

cd "$(dirname "${BASH_SOURCE[0]}")/cli" && yarn run execute "$@" $ARGS
