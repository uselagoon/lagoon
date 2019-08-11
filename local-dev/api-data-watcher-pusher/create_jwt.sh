#!/usr/bin/env bash

set -euo pipefail

PAYLOAD='{
  "role": "admin",
  "iss": "api-data-watcher-pusher",
  "aud": "'$JWTAUDIENCE'",
  "sub": "api-data-watcher-pusher"
}'

jwtgen -a HS256 -s "${JWTSECRET}" --claims "${PAYLOAD}" $@