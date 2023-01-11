#!/bin/bash
set -e

# inject variables from environment into the Ansible var template
envsubst '$API_HOST $API_PORT $API_PROTOCOL $CLUSTER_TYPE $DELETED_STATUS_CODE $GIT_HOST $GIT_REPO_PREFIX $GIT_PORT $ROUTE_SUFFIX_HTTP $ROUTE_SUFFIX_HTTP_PORT $ROUTE_SUFFIX_HTTPS $ROUTE_SUFFIX_HTTPS_PORT $SSH_HOST $SSH_PORT $SSH_PORTAL_HOST $SSH_PORTAL_PORT $SSH_TOKEN_HOST $SSH_TOKEN_PORT $WEBHOOK_HOST $WEBHOOK_PORT $WEBHOOK_PROTOCOL $WEBHOOK_REPO_PREFIX' < /ansible/tests/vars/test_vars.yaml | sponge /ansible/tests/vars/test_vars.yaml

if [ ! -z "$SSH_PRIVATE_KEY" ]; then
  mkdir -p ~/.ssh
  echo -e "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
  chmod 400 ~/.ssh/id_rsa
  rm -f $SSH_AUTH_SOCK
  eval $(ssh-agent -a $SSH_AUTH_SOCK)
  ssh-add ~/.ssh/id_rsa
fi

echo -e "Host * \n    StrictHostKeyChecking no" >> /etc/ssh/ssh_config

exec "$@"
