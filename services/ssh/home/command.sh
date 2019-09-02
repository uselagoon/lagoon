#!/bin/bash

# command.sh is called in two ways:
# 1. with 2 arguments (the API_ADMIN_TOKEN and USER_SSH_KEY), the ACTION needs to be extracted from
# SSH_ORIGINAL_COMMAND (it is sent by the user as a ssh parameter)
# 2. with 4 arguments where the 3rd is the ACTION and the 4th the SSH_USERNAME.
# To handle that we shift the first two arguments and append $SSH_ORIGINAL_COMMAND to the remaining argument list
API_ADMIN_TOKEN=$1
USER_SSH_KEY=$2
shift 2
set -- "$@" $SSH_ORIGINAL_COMMAND

# Consume the ACTION and shift it
ACTION=$1
shift 1

case $ACTION in
  'token')
    ./token.sh "$API_ADMIN_TOKEN" "$USER_SSH_KEY"
    ;;

  'grant')
    ./grant.sh "$API_ADMIN_TOKEN" "$USER_SSH_KEY"
    ;;

  'token-debug')
    ./token-debug.sh "$API_ADMIN_TOKEN" "$USER_SSH_KEY"
    ;;

  'rsh')
    ./rsh.sh "$API_ADMIN_TOKEN" "$USER_SSH_KEY" "$@"
    ;;

  *)
    echo 'No action given, currently available: token, rsh'
    exit 1

    ;;
esac
