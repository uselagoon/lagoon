#!/bin/bash

export USER_ID=$(id -u)

ep /home/token.sh
ep /home/grant.sh
ep /home/token-debug.sh

ep /etc/libnss-ato.conf

# filling /authorize.env with all our current env variables, this file
# will be sourced by /authorize.sh in order to have all environment variables.
# We can't use `ep /authorize.sh` as we are not running as root, but openssh
# expects every AuthorizedKeysCommand to be owned by root and nobody can have
# write access.
export >> /authorize.env
