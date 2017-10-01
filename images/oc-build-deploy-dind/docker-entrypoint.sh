#!/bin/bash
set -e

if docker -H docker-host.default.svc info &> /dev/null; then
    export DOCKER_HOST=docker-host.default.svc
else
    dind dockerd --insecure-registry=$OUTPUT_REGISTRY &> /dev/null &
fi

mkdir -p ~/.ssh

cp /var/run/secrets/lagoon/ssh/ssh-privatekey ~/.ssh/id_rsa
chmod 400 ~/.ssh/id_rsa

echo -e "Host * \n    StrictHostKeyChecking no" > ~/.ssh/config

exec "$@"
