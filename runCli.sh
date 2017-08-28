#!/bin/bash

export SSH_AUTH_HOST=localhost
export SSH_AUTH_PORT="2020"
export SSH_AUTH_USER="api"
export API_URL="http://localhost:3000/graphql"

cd "$(dirname "${BASH_SOURCE[0]}")/cli" && yarn run execute "$@"
