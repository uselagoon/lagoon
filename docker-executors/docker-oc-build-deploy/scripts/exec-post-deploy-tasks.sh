#!/bin/bash -xe

set -o pipefail

oc run cli --rm -i --attach --image="172.30.1.1:5000/$OPENSHIFT_PROJECT/cli:latest" --image-pull-policy="Always" --restart=Never -- bash -c "${POST_DEPLOY_TASK}"