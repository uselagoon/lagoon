#!/bin/bash

if [ "$GIT_AUTHORIZED_KEYS" ]; then
  echo -e "$GIT_AUTHORIZED_KEYS" > /git/.ssh/authorized_keys
fi

exec /sbin/runsvdir /etc/service
