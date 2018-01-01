#!/bin/bash

# generating a JWT Token with Role Admin to contact to the api
export API_ADMIN_TOKEN=$(/create_jwt.sh)

export USER_ID=$(id -u)

ep /home/token.sh

ep /etc/libnss-mysql.cfg

# filling /authorize.env with all our current env variables, this file
# will be sourced by /authorize.sh in order to have all environment variables.
# We can't use `ep /authorize.sh` as we are not running as root, but openssh
# expects every AuthorizedKeysCommand to be owned by root and nobody can have
# write access.
export >> /authorize.env

set -x

if [ ! -z ${OPENSHIFT_LAGOON_SERVICEACCOUNT_TOKEN+x} ]; then
  /usr/bin/oc login --insecure-skip-tls-verify --token="${OPENSHIFT_LAGOON_SERVICEACCOUNT_TOKEN}" ${OPENSHIFT_CONSOLE_URL:-https://kubernetes.default.svc}
else
  # this will be used only for local development
  /usr/bin/oc login --insecure-skip-tls-verify -u developer -p developer ${OPENSHIFT_CONSOLE_URL:-https://kubernetes.default.svc}
fi

set +x