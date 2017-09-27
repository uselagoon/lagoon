#!/bin/bash
set -e

if docker -H docker.dind.svc:2375 info &> /dev/null; then
    export DOCKER_HOST=docker.dind.svc:2375
else
    dind dockerd --insecure-registry=$OUTPUT_REGISTRY &> /dev/null &
fi

mkdir -p ~/.ssh

cp /var/run/secrets/lagoon/ssh/ssh-privatekey ~/.ssh/id_rsa
chmod 400 ~/.ssh/id_rsa

echo -e "Host * \n    StrictHostKeyChecking no" > ~/.ssh/config

exec "$@"
