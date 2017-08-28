#!/bin/bash

ep /home/get-jwt-token.sh

# filling /authorize.env with all our current env variables, this file
# will be sourced by /authorize.sh in order to have all environment variables.
# We can't use `ep /authorize.sh` as we are not running as root, but openssh
# expects every AuthorizedKeysCommand to be owned by root and nobody can have
# write access.
export >> /authorize.env