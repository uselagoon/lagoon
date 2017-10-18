#!/bin/bash
set -e

if docker -H docker-host.default.svc info &> /dev/null; then
    export DOCKER_HOST=docker-host.default.svc
else
    echo "could not connect to docker-host.default.svc"; exit 1
fi

mkdir -p ~/.ssh

cp /var/run/secrets/lagoon/ssh/ssh-privatekey ~/.ssh/id_rsa
chmod 400 ~/.ssh/id_rsa

echo -e "Host * \n    StrictHostKeyChecking no" > ~/.ssh/config

exec "$@"
