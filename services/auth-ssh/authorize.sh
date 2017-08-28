#!/bin/bash

# @file
# This file is called by OpenSSH via an AuthorizedKeysCommand Script
# It is responsible to talk to the api host and getting all AuthorizedKeys
# in an OpenSSH readable format back.

# OpenSSH does not pass environment variables into AuthorizedKeysCommand
# scripts, but we need them for $SERVICE_ADMIN_TOKEN and $AMAZEEIO_API_HOST
# so we source the file /authorize.env which has been filled with env
# variables during the container entrypoint.
source /authorize.env

# This token will be required for accessing the sshKeys in the AmazeeIO api
bearer="Authorization: bearer $SERVICE_ADMIN_TOKEN"

api=$AMAZEEIO_API_HOST

keys=$(wget --header "$bearer" $api/keys --content-on-error -q -O -)

options="no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty"
command="/bin/bash /home/get-jwt-token.sh"

##### START ACTUAL IMPLEMENTATION

# TODO: This is a super dirty hack. Directly printing the output into
# stdout, however, doesn't work. I have no fucking clue and this is
# super weird.
#
# Even with the solution below (the hack) we get random login failures
# here and there. Someone with better bash and debugging skills than me
# needs to take a look.
#
# The following code does not work:

# while read -r key; do
#   printf "$key\n"
# done <<< "$keys"

##### END ACTUAL IMPLEMENTATION
##### START HACKY TEMPORARY SOLUTION

# Empty the keys file or create it.
:> /home/keys

while read -r key; do
  printf '%s\n' "$options,command=\"$command '$key'\" $key" >> /home/keys
done <<< "$keys"

cat /home/keys

##### END HACKY TEMPORARY SOLUTION
