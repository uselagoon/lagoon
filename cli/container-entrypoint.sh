#!/bin/bash
set -e

if [ ! -z "$SSH_PRIVATE_KEY" ]; then
  mkdir -p ~/.ssh
  echo -e "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
  chmod 400 ~/.ssh/id_rsa

  eval $(ssh-agent)
  ssh-add ~/.ssh/id_rsa
fi

echo -e "Host * \n    StrictHostKeyChecking no" > ~/.ssh/config