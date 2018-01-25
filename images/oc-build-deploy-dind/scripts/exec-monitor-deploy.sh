#!/bin/bash

oc rollout --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} status ${SERVICE_ROLLOUT_TYPE} ${SERVICE_NAME} --watch
