#!/bin/bash

# if a token is requested this script is called with they ssh public key of the client as first parameter
key=$1

# $SSH_ORIGINAL_COMMAND contains as first parameter the command that the client would like to call, so we set the argument list to that
set -- $SSH_ORIGINAL_COMMAND

case $1 in
  'token')
    ./token.sh "$key"
    ;;

  'rsh')
    # the second argument is the project the client would like to connect too, save that
    shift
    PROJECT=$1

    # rsh.sh expects the variable $SSH_ORIGINAL_COMMAND to not contain the project, so we remove the project from it and save it
    shift
    SSH_ORIGINAL_COMMAND="$@"

    # call the remote shell script with the project the client wants
    ./rsh.sh $PROJECT
    ;;

  *)
    echo 'No action given, currently available: token, rsh'
    exit 1

    ;;
esac
