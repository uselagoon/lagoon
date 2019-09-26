#!/bin/bash

set -m -e

# Create hashes for the passwords
LOGSDB_ADMIN_PASSWORD_HASH=$(plugins/opendistro_security/tools/hash.sh -env LOGSDB_ADMIN_PASSWORD)
LOGSDB_KIBANASERVER_PASSWORD_HASH=$(plugins/opendistro_security/tools/hash.sh -env LOGSDB_KIBANASERVER_PASSWORD)

# Fill hashes into the yaml file
sed -i 's@{admin-hash}@'"$LOGSDB_ADMIN_PASSWORD_HASH"'@' plugins/opendistro_security/securityconfig/internal_users.yml
sed -i 's@{kibanaserver-hash}@'"$LOGSDB_KIBANASERVER_PASSWORD_HASH"'@' plugins/opendistro_security/securityconfig/internal_users.yml

# Fill clear text passwords, for easyness
sed -i 's@{admin-password}@'"$LOGSDB_ADMIN_PASSWORD"'@' plugins/opendistro_security/securityconfig/internal_users.yml
sed -i 's@{kibanaserver-password}@'"$LOGSDB_KIBANASERVER_PASSWORD"'@' plugins/opendistro_security/securityconfig/internal_users.yml


ep plugins/opendistro_security/securityconfig/config.yml

set +e

/usr/local/bin/docker-entrypoint.sh