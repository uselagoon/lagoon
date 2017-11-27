#!/bin/sh

if ! whoami &> /dev/null; then
  if [ -w /etc/passwd ]; then
    echo "${USER_NAME:-user}:x:$(id -u):0:${USER_NAME:-user}:${HOME}:/bin/sh" >> /etc/passwd
  fi
fi