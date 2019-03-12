#!/bin/bash

set -eu -o pipefail

# disable globbing
set -f;
# set field separator to NL (only)
IFS=$'\n';
# get all ssh keys from api-db into a bash array
SSHKEY_RECORDS=( $(mysql -u$MARIADB_USER -p$MARIADB_PASSWORD -h$HOSTNAME $MARIADB_DATABASE --batch -sse "select id, key_type, key_value from ssh_key") );

for SSHKEY_RECORD in "${SSHKEY_RECORDS[@]}";
do
  RECORD_ID=$(awk '{print $1}' <<< "$SSHKEY_RECORD");
  SSHKEY=$(awk '{print $2, $3}' <<< "$SSHKEY_RECORD");
  FINGERPRINT=$(ssh-keygen -lE sha256 -f - <<< "$SSHKEY" | awk '{print $2}');
  mysql -u$MARIADB_USER -p$MARIADB_PASSWORD -h$HOSTNAME $MARIADB_DATABASE -e "UPDATE ssh_key SET key_fingerprint = '$FINGERPRINT' WHERE id = $RECORD_ID";
done;
