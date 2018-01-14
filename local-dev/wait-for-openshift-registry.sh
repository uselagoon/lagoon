#!/bin/sh

set -eo pipefail

echo "Waiting until registry within openshift is ready "
until $(nc -zv $(cat openshift) 30000); do
    printf '.'
    sleep 1
done