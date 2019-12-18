#!/bin/bash
set -e

/home/clair/install_cert.sh
exec "/home/clair/dumb-init" "--" "/home/clair/clair" "-config" "/etc/clair/config.yaml"
set +e