#!/bin/bash
set -e

/harbor/install_cert.sh

exec "/chartserver/chartm" #Parameters are set by ENV
set +e