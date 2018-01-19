#!/bin/bash

export SSH_HOST=localhost
export SSH_PORT="2020"
export SSH_USER="lagoon"
export API_URL="http://localhost:3000/graphql"

# Test if the first version number provided is higher than the second one
# > version_gt 2 1
# > echo $?
# 0
# > version_gt 1.2.2 1
# > echo $?
# 0
# > version_gt 1 2
# > echo $?
# 1
# > version_gt 1 1
# > echo $?
# 1
function version_gt() {
  test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1";
}

# Set the identity option to the local private key for the `login` and `logout`
# commands unless the option is already set.
if [[ $@ =~ login|logout && ! $@ =~ ^.*(--identity\ |-i\ ).*$ ]]; then
  ARGS="--identity $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/local-dev/cli_id_rsa"

  # Only use `--` prefix if the Yarn version is less than 1
  if version_gt 1 "$(yarn -v)" && [[ $@ =~ ^[^-][^-] ]]; then
    PREFIX="--"
  fi
fi

cd "$(dirname "${BASH_SOURCE[0]}")/cli" && yarn run execute $PREFIX "$@" $ARGS
