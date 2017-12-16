#!/usr/bin/env bash

set -euo pipefail

PAYLOAD='{
  "role": "admin",
  "iss": "rsh-console Bash JWT Generator",
  "aud": "'$JWTAUDIENCE'",
  "sub": "remote-shell"
}'

jwtgen -a HS256 -s "${JWTSECRET}" --claims "${PAYLOAD}" $@