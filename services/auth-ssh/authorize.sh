#!/bin/bash

# @file
# This file is called by OpenSSH via an AuthorizedKeysCommand Script
# It is responsible to talk to the api host and getting all AuthorizedKeys
# in an OpenSSH readable format back.

# OpenSSH does not pass environment variables into AuthorizedKeysCommand
# scripts, but we need them for $SERVICE_API_ADMIN_TOKEN and $AMAZEEIO_API_HOST
# so we source the file /authorize.env which has been filled with env
# variables during the container entrypoint.
source /authorize.env

# This token will be required for accessing the sshKeys in the AmazeeIO api
bearer="Authorization: bearer $SERVICE_API_ADMIN_TOKEN"

api=$AMAZEEIO_API_HOST
fingerprint=$1

data="{\"fingerprint\": \"$fingerprint\"}"
keys=$(wget --header "Content-Type: application/json" --header "$bearer" $api/keys --post-data "$data" --content-on-error -q -O -)

options="no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty"
command="/bin/bash /home/get-jwt-token.sh"

if [ -n "$keys" ]; then
    while read -r key; do
        printf '%s\n' "$options,command=\"$command '$key'\" $key"
    done <<< "$keys"
fi
