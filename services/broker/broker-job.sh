#!/bin/sh

# This script needs to be run after a minor version update (or prior to one)
# to ensure that any disabled feature_flags are correctly enabled.
# it is run within a helm job when installed via helm

function is_broker_running {
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" "http://${SERVICE_NAME}:15672/api/health/checks/virtual-hosts/")
  if [[ $http_code -eq 200 ]]; then
    return 0
  else
    return 1
  fi
}

echo check broker is running
until is_broker_running; do
  echo Broker not running, waiting 2 seconds
  sleep 2
done

echo enabling any disabled feature flags
for feature in $(curl -s -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" "http://${SERVICE_NAME}:15672/api/feature-flags/" | gojq -r '.[] | select(.state=="disabled" and .stability!="experimental") | .name'); do
  echo " - enabling ${feature}"
  curl -X PUT --header "Content-Type: application/json" -s -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" -d '{"name":"'${feature}'"}' "http://${SERVICE_NAME}:15672/api/feature-flags/${feature}/enable"
done
echo all feature flags enabled

echo removing legacy lagoon-ha policy
if [[ ! "$(curl -s -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" "http://${SERVICE_NAME}:15672/api/policies/%2F/lagoon-ha")" =~ "Object Not Found" ]]
then
  echo " - removing lagoon-ha policy"
  curl -X DELETE -s -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" "http://${SERVICE_NAME}:15672/api/policies/%2F/lagoon-ha"
else
  echo " - lagoon-ha policy already removed"
fi

echo removing unused lagoon-logs queues
for queue in "workflows" "slack" "discord" "rocketchat" "microsoftTeams" "email" "webhook" "s3"; do
if [[ ! "$(curl -s -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" "http://${SERVICE_NAME}:15672/api/queues/%2F/lagoon-logs%3A${queue}")" =~ "Object Not Found" ]]
  then
    echo " - removing lagoon-logs:${queue} queue"
    curl -X DELETE -s -u "${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}" "http://${SERVICE_NAME}:15672/api/queues/%2F/lagoon-logs%3A${queue}"
  else
    echo " - lagoon-logs:${queue} queue already removed"
  fi
done
