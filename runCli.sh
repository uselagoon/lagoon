#!/bin/bash

export SSH_HOST=localhost
export SSH_PORT="2020"
export SSH_USER="lagoon"
export API_URL="http://localhost:3000/graphql"

# Set the identity option to the local private key for the `login` and `logout`
# commands unless the option is already set.
if [[ $@ =~ login|logout && ! $@ =~ ^.*(--identity\ |-i\ ).*$ ]]; then
  ARGS="--identity $(dirname "${BASH_SOURCE[0]}")/local-dev/cli_id_rsa"
  if [[ $@ =~ ^[^-][^-] ]]; then
    PREFIX="--"
  fi
fi

cd "$(dirname "${BASH_SOURCE[0]}")/cli" && yarn run execute $PREFIX "$@" $ARGS
