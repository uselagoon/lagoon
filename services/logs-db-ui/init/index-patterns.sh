#!/usr/bin/env bash

# test for lagoon-logs-* index pattern, create and set to default if it does not exist
until sleep 15; curl -u "kibanaserver:$LOGSDB_KIBANASERVER_PASSWORD" --fail --silent 'http://logs-db-ui:5601/api/saved_objects/index-pattern' | grep "lagoon-logs";
do
  LAGOON_LOG_ID=$(curl -u "kibanaserver:$LOGSDB_KIBANASERVER_PASSWORD" --silent 'http://logs-db-ui:5601/api/saved_objects/index-pattern' -H 'kbn-version: 6.2.4' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary '{"attributes":{"title":"lagoon-logs-*","timeFieldName":"@timestamp"}}' --compressed \
  | grep -oE '"id":(\d*?,|.*?[^\\]",)' | awk -F'"' '{print $4}') && \
  curl -u "kibanaserver:$LOGSDB_KIBANASERVER_PASSWORD" 'http://logs-db-ui:5601/api/kibana/settings/defaultIndex' -H 'kbn-version: 6.2.4' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*'  -H 'Connection: keep-alive' -H 'DNT: 1' --data-binary "{\"value\":\"$LAGOON_LOG_ID\"}" --compressed
done

# test for service-logs-* index pattern, create if it does not exist
until curl -u "kibanaserver:$LOGSDB_KIBANASERVER_PASSWORD" --fail --silent 'http://logs-db-ui:5601/api/saved_objects/index-pattern' | grep "service-logs";
do
  curl -u "kibanaserver:$LOGSDB_KIBANASERVER_PASSWORD" 'http://logs-db-ui:5601/api/saved_objects/index-pattern' -H 'kbn-version: 6.2.4' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary '{"attributes":{"title":"service-logs-*","timeFieldName":"@timestamp"}}' --compressed
done

# test for router-logs-* index pattern, create if it does not exist
until curl -u "kibanaserver:$LOGSDB_KIBANASERVER_PASSWORD" --fail --silent 'http://logs-db-ui:5601/api/saved_objects/index-pattern' | grep "router-logs";
do
  curl -u "kibanaserver:$LOGSDB_KIBANASERVER_PASSWORD" 'http://logs-db-ui:5601/api/saved_objects/index-pattern' -H 'kbn-version: 6.2.4' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary '{"attributes":{"title":"router-logs-*","timeFieldName":"@timestamp"}}' --compressed
done
