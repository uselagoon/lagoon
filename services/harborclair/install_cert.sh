#!/bin/sh

set -e

if [ ! -f /home/clair/ca-bundle.crt.original ]; then
    cp /etc/pki/tls/certs/ca-bundle.crt /home/clair/ca-bundle.crt.original
fi

cp /home/clair/ca-bundle.crt.original /etc/pki/tls/certs/ca-bundle.crt