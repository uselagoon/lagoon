#!/usr/bin/env bash

set -euo pipefail

PAYLOAD='{
  "role": "admin",
  "iss": "auth-ssh Bash Generator",
  "aud": "'$JWTAUDIENCE'",
  "sub": "auth-server"
}'

jwtgen -a HS256 -s "${JWTSECRET}" --claims "${PAYLOAD}" $@