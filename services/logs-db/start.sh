#!/bin/bash

set -m

# Create hashes for the passwords
LOGSDB_ADMIN_PASSWORD_HASH=$(plugins/search-guard-6/tools/hash.sh -env LOGSDB_ADMIN_PASSWORD)
LOGSDB_KIBANASERVER_PASSWORD_HASH=$(plugins/search-guard-6/tools/hash.sh -env LOGSDB_KIBANASERVER_PASSWORD)

# Fill hashes into the yaml file
sed -i 's@{admin-hash}@'"$LOGSDB_ADMIN_PASSWORD_HASH"'@' plugins/search-guard-6/sgconfig/sg_internal_users.yml
sed -i 's@{kibanaserver-hash}@'"$LOGSDB_KIBANASERVER_PASSWORD_HASH"'@' plugins/search-guard-6/sgconfig/sg_internal_users.yml

# Fill clear text passwords, for easyness
sed -i 's@{admin-password}@'"$LOGSDB_ADMIN_PASSWORD"'@' plugins/search-guard-6/sgconfig/sg_internal_users.yml
sed -i 's@{kibanaserver-password}@'"$LOGSDB_KIBANASERVER_PASSWORD"'@' plugins/search-guard-6/sgconfig/sg_internal_users.yml


ep plugins/search-guard-6/sgconfig/sg_config.yml

/usr/local/bin/docker-entrypoint.sh &

RET=1

while [[ RET -ne 0 ]]; do
    echo "SearchGuard: Waiting for Elasticsearch to be ready..."
    curl -XGET -k -u "admin:$LOGSDB_ADMIN_PASSWORD" "http://localhost:9200/" >/dev/null 2>&1
    RET=$?
    sleep 5
done

if [[ $(curl -s -XGET -k -u "admin:$LOGSDB_ADMIN_PASSWORD" "http://localhost:9200/_searchguard") =~ "Search Guard not initialized" ]]; then

    echo "SearchGuard: Initializing..."
    ./sgadmin_demo.sh
fi

fg