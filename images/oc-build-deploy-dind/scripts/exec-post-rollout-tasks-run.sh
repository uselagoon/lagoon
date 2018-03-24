#!/bin/bash

oc -n ${OPENSHIFT_PROJECT} --loglevel=6 rsh dc/${SERVICE_NAME} bash -c "${COMMAND}"