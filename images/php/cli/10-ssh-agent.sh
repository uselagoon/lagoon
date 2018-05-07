#!/bin/sh
set -e

# If we there is an ssh key injected via lagoon and kubernetes, we use that
if [ -f /var/run/secrets/lagoon/sshkey/ssh-privatekey ]; then
  cp -f /var/run/secrets/lagoon/sshkey/ssh-privatekey /home/.ssh/key
# If there is an env variable SSH_PRIVATE_KEY we use that
elif [ ! -z "$SSH_PRIVATE_KEY" ]; then
  echo -e "$SSH_PRIVATE_KEY" > /home/.ssh/key
fi

# Test if pygmy or cachalot ssh-agents are mounted and symlink them as our known ssh-auth-sock file.
# This will only be used in local development
if [ -S /tmp/amazeeio_ssh-agent/socket ]; then
  ln -sf /tmp/amazeeio_ssh-agent/socket $SSH_AUTH_SOCK
# Use the existing key instead
elif [ -f /home/.ssh/key ]; then
  # add a new line to the key. OpenSSH is very picky that keys are always end with a newline
  echo >> /home/.ssh/key
  chmod 400 /home/.ssh/key
  rm -f $SSH_AUTH_SOCK
  eval $(ssh-agent -a $SSH_AUTH_SOCK)
  ssh-add /home/.ssh/key
fi
