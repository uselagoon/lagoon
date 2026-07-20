#!/usr/bin/env bash

set -eo pipefail

if [ -n "$MYSQL_LOG_SLOW" ]; then
  # Log slow queries to stdout
  ln -sf /proc/1/fd/1 /var/log/mysql-slow.log
fi
