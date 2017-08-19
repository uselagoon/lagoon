#!/bin/bash -xe

oc -n ${OPENSHIFT_PROJECT} rsh dc/${SERVICE_NAME} bash -c "${COMMAND}"