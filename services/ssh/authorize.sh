#!/bin/bash

# @file
# This file is called by OpenSSH via an AuthorizedKeysCommand Script
# It is responsible to talk to the api host and getting all AuthorizedKeys
# in an OpenSSH readable format back.

# OpenSSH does not pass environment variables into AuthorizedKeysCommand
# scripts, but we need them for $API_ADMIN_TOKEN and $API_HOST
# so we source the file /authorize.env which has been filled with env
# variables during the container entrypoint.
source /authorize.env

API_ADMIN_TOKEN=$(/create_60_sec_jwt.py)

# This token will be required for accessing the sshKeys in the lagoon api
bearer="Authorization: bearer $API_ADMIN_TOKEN"

api=$API_HOST
ssh_username=$1
ssh_fingerprint=$2

data="{\"fingerprint\": \"$ssh_fingerprint\"}"
keys=$(wget --header "Content-Type: application/json" --header "$bearer" $api/keys --post-data "$data" -q --content-on-error -O -)

options="no-port-forwarding,no-X11-forwarding,no-agent-forwarding"

if [ -n "$keys" ]; then
    while read -r key; do
        if [ $ssh_username == "lagoon" ]; then
            printf '%s\n' "$options,command=\"/bin/bash /home/command.sh '$API_ADMIN_TOKEN' '$key'\" $key"
        else
            printf '%s\n' "$options,command=\"/bin/bash /home/command.sh '$API_ADMIN_TOKEN' '$key' rsh '$ssh_username' \" $key"
        fi

    done <<< "$keys"
fi
