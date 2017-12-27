#!/bin/sh
set -e

eval $(ssh-agent)
ssh-add ~/.ssh/id_rsa

echo -e "Host * \n    StrictHostKeyChecking no" > ~/.ssh/config

exec "$@"