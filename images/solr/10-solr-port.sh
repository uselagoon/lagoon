#!/bin/sh

# SOLR is capable of having it's own port overwritten via SOLR_PORT, but on kubernetes this env variable is filled with
# SOLR_PORT=tcp://172.30.32.255:8983, so we check if the env variable is an actual port only and if not we use the default port
# Inspired from: https://github.com/docker-solr/docker-solr/blob/6d7fa219c3b3407e0dd29fb17b15ec9e6df85058/6.6/alpine/scripts/docker-entrypoint.sh#L11-L13
if [[ -n "$SOLR_PORT" ]] && ! /bin/bash -c "grep -E -q '^[0-9]+$' <<<\"${SOLR_PORT:-}\""; then
  SOLR_PORT=8983
  export SOLR_PORT
fi