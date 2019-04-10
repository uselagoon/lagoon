#!/bin/bash

set -eu -o pipefail

# disable globbing
set -f;
# set field separator to NL (only)
IFS=$'\n';

DUPLICATE_SSHKEY_RECORDS=( $(mysql infrastructure --batch -sse "SELECT count(*) count, key_value FROM ssh_key GROUP BY key_value HAVING count > 1") );

if [ ${#DUPLICATE_SSHKEY_RECORDS[@]} -ne 0 ]; then
  echo "====== FOUND DUPLICATE SSH KEYS IN LAGOON API DATABASE!"
  for DUPLICATE_SSHKEY_RECORD in "${DUPLICATE_SSHKEY_RECORDS[@]}";
  do
    echo ""
    echo $(awk '{print $2}' <<< "$DUPLICATE_SSHKEY_RECORD");
  done;
  echo ""
  echo "====== PLEASE REMOVE DUPLICATED SSH KEYS AND RUN INITIALIZATION OF DB AGAIN"
  exit 1
fi

echo "=== Starting SSH KEY Fingerprint generation"

# get all ssh keys which have no fingerprint yet from api-db into a bash array
SSHKEY_RECORDS=( $(mysql infrastructure --batch -sse "SELECT id, key_type, key_value FROM ssh_key WHERE key_fingerprint is NULL") );

for SSHKEY_RECORD in "${SSHKEY_RECORDS[@]}";
do
  RECORD_ID=$(awk '{print $1}' <<< "$SSHKEY_RECORD");
  SSHKEY=$(awk '{print $2, $3}' <<< "$SSHKEY_RECORD");
  FINGERPRINT=$(ssh-keygen -lE sha256 -f - <<< "$SSHKEY" | awk '{print $2}');
  echo "Adding SSH Key Fingerprint for SSH KEY '$RECORD_ID': $FINGERPRINT"
  mysql infrastructure -e "UPDATE ssh_key SET key_fingerprint = '$FINGERPRINT' WHERE id = $RECORD_ID";
done;

echo "=== Finished SSH KEY Fingerprint generation"
