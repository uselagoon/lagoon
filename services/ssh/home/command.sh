#!/bin/bash
set -- $SSH_ORIGINAL_COMMAND "$@"

case $1 in
  'token')
    shift
    . token.sh
    ;;

  'rsh')
    shift
    . rsh.sh
  ;;
  *)
    echo 'No action given, currently available: token, rsh'
    exit 1

    ;;
esac
