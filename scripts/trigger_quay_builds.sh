#!/bin/bash
#set -x

ROBOT_TOKEN="${ROBOT_TOKEN:-XXXX}"
REPOSITORY="${REPOSITORY:-XXXX}"
TRIGGER_UUID="${TRIGGER_UUID:-XXXX}"
BRANCH="${BRANCH:-master}"
JSON="{\"branch_name\": \"${BRANCH}\"}"

curl https://quay.io/api/v1/repository/desdrury/builder/trigger/${TRIGGER_UUID}/start \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ROBOT_TOKEN}" \
  -d $"$JSON"