#!/bin/bash

# This script will be the default ENTRYPOINT for all children docker images.
# It just sources all files within /amazeeio/entrypoints/* in an alphabetical order and then runs `exec` on the given parameter.

if [ -d /amazeeio/entrypoints ]; then
  for i in /amazeeio/entrypoints/*; do
    if [ -r $i ]; then
      . $i
    fi
  done
  unset i
fi

exec "$@"