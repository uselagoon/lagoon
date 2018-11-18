#!/usr/bin/env bash

set -eo pipefail

if [ "$LAGOON_ENVIRONMENT_TYPE" == "production" ]; then
  export MARIADB_INNODB_BUFFER_POOL_SIZE=1024M
  export MARIADB_INNODB_LOG_FILE_SIZE=256M
else
  PS1="${BLUE}$LAGOON_GIT_BRANCH${NORMAL}@$PS1"
fi