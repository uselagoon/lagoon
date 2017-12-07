#!/bin/bash

# @file
# This file is called by OpenSSH via an AuthorizedKeysCommand Script
# It is responsible to talk to the api host and getting all AuthorizedKeys
# in an OpenSSH readable format back.

# OpenSSH does not pass environment variables into AuthorizedKeysCommand
# scripts, but we need them for $SERVICE_API_ADMIN_TOKEN and $API_HOST
# so we source the file /authorize.env which has been filled with env
# variables during the container entrypoint.
source /authorize.env

SERVICE_API_ADMIN_TOKEN=$(/create_jwt.sh)

# This token will be required for accessing the sshKeys in the lagoon api
bearer="Authorization: bearer $SERVICE_API_ADMIN_TOKEN"

api=$API_HOST
fingerprint=$1

data="{\"fingerprint\": \"$fingerprint\"}"
keys=$(wget --header "Content-Type: application/json" --header "$bearer" $api/keys --post-data "$data" -q --content-on-error -O -)

options="no-port-forwarding,no-X11-forwarding,no-agent-forwarding"
command="/bin/bash /rsh-console"

if [ -n "$keys" ]; then
    while read -r key; do
        printf '%s\n' "$options,command=\"$command '$key'\" $key"
    done <<< "$keys"
fi
