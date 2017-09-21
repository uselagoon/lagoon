#!/bin/bash
set -e

dind dockerd --insecure-registry=$OUTPUT_REGISTRY &> /dev/null &

mkdir -p ~/.ssh

cp /var/run/secrets/lagoon/ssh/ssh-privatekey ~/.ssh/id_rsa
chmod 400 ~/.ssh/id_rsa

echo -e "Host * \n    StrictHostKeyChecking no" > ~/.ssh/config

exec "$@"
