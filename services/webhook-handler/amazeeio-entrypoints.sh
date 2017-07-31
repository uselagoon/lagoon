#!/bin/sh

if [ -d /amazeeio/entrypoints ]; then
  for i in /amazeeio/entrypoints/*; do
    if [ -r $i ]; then
      . $i
    fi
  done
  unset i
fi

echo "$@"

exec "$@"