#!/bin/sh
set -e

# If we there is an ssh key injected via lagoon and kubernetes, we use that
if [ -f /var/run/secrets/lagoon/sshkey/ssh-privatekey ]; then
  cp -f /var/run/secrets/lagoon/sshkey/ssh-privatekey /home/.ssh/key
# If there is an env variable SSH_PRIVATE_KEY we use that
elif [ ! -z "$SSH_PRIVATE_KEY" ]; then
  echo -e "$SSH_PRIVATE_KEY" > /home/.ssh/key
# If there is an env variable LAGOON_SSH_PRIVATE_KEY we use that
elif [ ! -z "$LAGOON_SSH_PRIVATE_KEY" ]; then
  echo -e "$LAGOON_SSH_PRIVATE_KEY" > /home/.ssh/key
fi