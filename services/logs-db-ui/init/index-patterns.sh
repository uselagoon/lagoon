#!/usr/bin/env bash

# test for lagoon-logs-* index pattern, create and set to default if it does not exist
if ! [ $(curl --silent 'http://logs-db-ui:5601/api/saved_objects/index-pattern' | grep "lagoon-logs") ]
then
  LAGOON_LOG_ID=$(curl --silent 'http://logs-db-ui:5601/api/saved_objects/index-pattern' -H 'kbn-version: 6.1.1' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary '{"attributes":{"title":"lagoon-logs-*","timeFieldName":"@timestamp"}}' --compressed \
  | grep -oE '"id":(\d*?,|.*?[^\\]",)' | awk -F'"' '{print $4}')
  curl 'http://logs-db-ui:5601/api/kibana/settings/defaultIndex' -H 'kbn-version: 6.1.1' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*'  -H 'Connection: keep-alive' -H 'DNT: 1' --data-binary "{\"value\":\"$LAGOON_LOG_ID\"}" --compressed
fi

# test for service-logs-* index pattern, create if it does not exist
if ! [ $(curl --silent 'http://logs-db-ui:5601/api/saved_objects/index-pattern' | grep "service-logs") ]
then
  curl 'http://logs-db-ui:5601/api/saved_objects/index-pattern' -H 'kbn-version: 6.1.1' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary '{"attributes":{"title":"service-logs-*","timeFieldName":"@timestamp"}}' --compressed
fi
