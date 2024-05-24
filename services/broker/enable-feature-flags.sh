#!/bin/sh

# This script needs to be run after a minor version update (or prior to one)
# to ensure that any disabled feature_flags are correctly enabled.

for feature in $(curl -s -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" "http://${SERVICE_NAME}:15672/api/feature-flags/" | gojq -r '.[] | select(.state=="disabled") | .name'); do
  echo enabling ${feature}
  curl -X PUT --header "Content-Type: application/json" -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" -d '{"name":"'${feature}'"}' http://${SERVICE_NAME}:15672/api/feature-flags/${feature}/enable
done
