#!/bin/bash

# dotenv implementation in Bash:
# We basically search for files within the current working directory (defined by WORKDIR in the Dockerfile).
# If it exists, we source them, which means their variables will exist as environment variables for all next processes
# The files are expected to be in this format:
#
#     var1=value
#     VAR2=value
#
# As there can already be env variables defined in either the Dockerfile of during runtime (via docker run), we have an hierarchy of Environment variables:
# (env variables defined in lower numbers are stronger)
# 1. Runtime env variables (docker run)
# 2. Env variables defined in Dockerfile (ENV)
# 3. Env variables defined in `.amazeeio.env.$BRANCHNAME` (if file exists and where $BRANCHNAME is the Branch this Dockerimage has been built for),
#    use this for overwriting variables for only specific branches
# 4. Env variables defined in `.env`
# 5. Env variables defined in `.env.defaults`

# first export all current environment variables into a file.
# We do that in order to keep the hierarchy of environment variables. Already defined ones are probably overwritten
# via an `docker run -e VAR=VAL` system and they should still be used even they are defined in dotenv files.
export -p > /tmp/dotenv-exiting

# set -a is short for `set -o allexport` which will export all variables in a file
set -a
[ -f .env.defaults ] && . ./.env.defaults
[ -f .env ] && . ./.env
[ -f .amazeeio.env.$AMAZEEIO_GIT_BRANCH ] && . ./.amazeeio.env.$AMAZEEIO_GIT_BRANCH
# Branch names can have weird special chars in them which are not allowed in File names, so we also try the Branch name with special chars replaced by dashes.
[ -f .amazeeio.env.$AMAZEEIO_GIT_SAFE_BRANCH ] && . ./.amazeeio.env.$AMAZEEIO_GIT_SAFE_BRANCH
set +a

# now export all previously existing environments variables so they are stronger than maybe existing ones in the dotenv files
. /tmp/dotenv-exiting