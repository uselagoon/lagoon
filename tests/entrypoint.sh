#!/bin/bash
set -e

if [ ! -z "$SSH_PRIVATE_KEY" ]; then
  mkdir -p ~/.ssh
  echo -e "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
  chmod 400 ~/.ssh/id_rsa
  rm -f $SSH_AUTH_SOCK
  eval $(ssh-agent -a $SSH_AUTH_SOCK)
  ssh-add ~/.ssh/id_rsa
fi

echo -e "Host * \n    StrictHostKeyChecking no" >> /etc/ssh/ssh_config

exec "$@"