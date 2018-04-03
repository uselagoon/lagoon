#!/bin/sh
set -e

if [ -f /var/run/secrets/lagoon/sshkey/ssh-privatekey ]; then
  cp /var/run/secrets/lagoon/sshkey/ssh-privatekey /home/.ssh/id_rsa
  # add a new line to the key. OpenSSH is very picky that keys are always end with a newline
  echo >> /home/.ssh/id_rsa

  chmod 400 /home/.ssh/id_rsa
  eval $(ssh-agent -a /tmp/ssh-agent)
  ssh-add /home/.ssh/id_rsa
fi

# Test if pygmy or cachalot ssh-agents are mounted and symlink them as our known ssh-auth-sock file.
# This will only be used in local development
if [ -S /tmp/amazeeio_ssh-agent/socket ]; then
  ln -s /tmp/amazeeio_ssh-agent/socket $SSH_AUTH_SOCK
fi