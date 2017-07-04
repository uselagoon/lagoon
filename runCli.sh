#!/bin/bash

# TODO: @fubhy wants to get this working for Docker for Mac
# function container () {
#   format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"
#   command=`docker ps | grep ${1} | sed 's/\|/ /' | awk '{print $1}'`
#   docker inspect --format "$format" $command
# }
#
# api=$(container "api")
# ssh=$(container "auth-ssh")
#
# export SSH_AUTH_HOST=$ssh
# export SSH_AUTH_PORT="2020"
# export SSH_AUTH_USER="api"
# export API_URL="http://$api/graphql"

export SSH_AUTH_HOST=localhost
export SSH_AUTH_PORT="2020"
export SSH_AUTH_USER="api"
export API_URL="http://localhost:8080/graphql"

cd "$(dirname "${BASH_SOURCE[0]}")/cli" && yarn run execute "$@"
