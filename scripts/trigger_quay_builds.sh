#!/bin/bash
#set -x

ROBOT_TOKEN="${ROBOT_TOKEN:-XXXX}"
REPOSITORY="${REPOSITORY:-XXXX}"
TRIGGER_UUID="${TRIGGER_UUID:-XXXX}"
BRANCH="${BRANCH:-master}"

cat << EOF > /tmp/json
{
  "branch_name": "$BRANCH"
}
EOF

curl https://quay.io/api/v1/repository/${REPOSITORY}/trigger/${TRIGGER_UUID}/start \
  -s -w "%{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ROBOT_TOKEN}" \
  -d @/tmp/json