#!/bin/sh
set -e

# If we there is an ssh key injected via lagoon and kubernetes, we use that
if [ ! -z "$SSH_PRIVATE_KEY" ]; then
  echo -e "$SSH_PRIVATE_KEY" > /home/.ssh/id_rsa
fi

