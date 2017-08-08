#!/bin/bash -xe

oc rsh dc/${SERVICE_NAME} bash -c "${COMMAND}"