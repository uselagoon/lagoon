#!/bin/sh
set -e

# Test if pygmy or cachalot ssh-agents are mounted and symlink them as our known ssh-auth-sock file.
# This will only be used in local development
if [ -S /tmp/amazeeio_ssh-agent/socket ]; then
  ln -sf /tmp/amazeeio_ssh-agent/socket $SSH_AUTH_SOCK
# Use the existing key instead (which was generated from 05-ssh-key.sh)
elif [ -f /home/.ssh/key ]; then
  # add a new line to the key. OpenSSH is very picky that keys are always end with a newline
  echo >> /home/.ssh/key
  chmod 400 /home/.ssh/key
  rm -f $SSH_AUTH_SOCK
  eval $(ssh-agent -a $SSH_AUTH_SOCK)
  ssh-add /home/.ssh/key
fi
