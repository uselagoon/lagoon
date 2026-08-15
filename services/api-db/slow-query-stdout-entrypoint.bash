#!/usr/bin/env bash

set -eo pipefail

if [ -n "$MARIADB_LOG_SLOW" ]; then
  # Log slow queries to stdout
  ln -sf /proc/1/fd/1 /var/log/mariadb-slow.log
fi
