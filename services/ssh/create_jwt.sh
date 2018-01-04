#!/usr/bin/env bash

set -euo pipefail

PAYLOAD='{
  "role": "admin",
  "iss": "ssh Bash JWT Generator",
  "aud": "'$JWTAUDIENCE'",
  "sub": "ssh"
}'

/usr/bin/nodejs /usr/local/bin/jwtgen -a HS256 -s "${JWTSECRET}" --claims "${PAYLOAD}" $@