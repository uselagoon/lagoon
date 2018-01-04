#!/bin/sh
set -e

if [ -f /var/run/secrets/lagoon/sshkey/ssh-privatekey ]; then
  cp /var/run/secrets/lagoon/sshkey/ssh-privatekey /home/.ssh/id_rsa
  chmod 400 /home/.ssh/id_rsa
  eval $(ssh-agent -a /tmp/ssh-agent)
  ssh-add /home/.ssh/id_rsa
fi