#!/bin/bash
set -e

if [ ! -z "$GIT_AUTHORIZED_KEYS" ]; then
  echo -e "$GIT_AUTHORIZED_KEYS" > /git/.ssh/authorized_keys
fi

exec "$@"
