#!/bin/bash

pushd local-dev

mkdir -p minishift

MINISHIFT_RELEASE=1.1.0

if [ $(uname) == "Darwin" ]; then
  curl -L https://github.com/minishift/minishift/releases/download/v$MINISHIFT_RELEASE/minishift-$MINISHIFT_RELEASE-darwin-amd64.tgz | tar xz -C minishift
else
  curl -L https://github.com/minishift/minishift/releases/download/v$MINISHIFT_RELEASE/minishift-$MINISHIFT_RELEASE-linux-amd64.tgz | tar xz -C minishift
fi


# delete a maybe existing instance of minishift
./minishift/minishift delete

mkdir -p minishift/registry-route
curl -L https://raw.githubusercontent.com/minishift/minishift/master/addons/registry-route/registry-route.addon -o minishift/registry-route/registry-route.addon
./minishift/minishift addons install minishift/registry-route --force
./minishift/minishift addons enable registry-route

./minishift/minishift start --vm-driver virtualbox --host-only-cidr "192.168.77.1/24" --routing-suffix 192.168.77.100.nip.io