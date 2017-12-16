#!/bin/bash

ep /home/token.sh

chmod g-w /home/token.sh

# generating a JWT Token with Role Admin to contact to the api
export API_ADMIN_TOKEN=$(/create_jwt.sh)

# filling /authorize.env with all our current env variables, this file
# will be sourced by /authorize.sh in order to have all environment variables.
# We can't use `ep /authorize.sh` as we are not running as root, but openssh
# expects every AuthorizedKeysCommand to be owned by root and nobody can have
# write access.
export >> /authorize.env

set -x

if [ -f /var/run/secrets/kubernetes.io/serviceaccount/token ]; then
  TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
  /usr/bin/oc login --insecure-skip-tls-verify --token="${TOKEN}" ${OPENSHIFT_CONSOLE_URL:-https://kubernetes.default.svc}
else
  # this will be used only for local development
  /usr/bin/oc login --insecure-skip-tls-verify -u developer -p developer ${OPENSHIFT_CONSOLE_URL:-https://kubernetes.default.svc}
fi

set +x