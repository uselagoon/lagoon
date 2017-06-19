#!/bin/bash

user=$1
server='http://api:8080'
keys=$(wget $server/keys --content-on-error -q -O -)

while read -r key; do
  echo "command=\"/bin/bash ~$user/retrieve-token.sh '"$key"'\" $key"
done <<< "$keys"
