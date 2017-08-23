#!/bin/bash

# first export all current environment variables into a file.
# We do that in order to keep the hierarchy of environment variables. Already defined ones are probably overwritten
# via an `docker run -e VAR=VAL` system and they should still be used even they are defined in dotenv files.
export -p > /tmp/dotenv-exiting

# set -a is short for `set -o allexport` which will export all variables in a file
set -a
[ -f .env.defaults ] && . ./.env.defaults
[ -f .env ] && . ./.env
[ -f .amazeeio.env.$AMAZEEIO_GIT_BRANCH ] && . ./.amazeeio.env.$AMAZEEIO_GIT_BRANCH
[ -f .amazeeio.env.$AMAZEEIO_GIT_SAFE_BRANCH ] && . ./.amazeeio.env.$AMAZEEIO_GIT_SAFE_BRANCH
set +a

# now export all previously existing environments variables so they are stronger than maybe existing ones in the dotenv files
. /tmp/dotenv-exiting