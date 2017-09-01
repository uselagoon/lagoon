#!/bin/bash

pushd local-dev

OC_VERSION=v3.6.0
OC_HASH=c4dd4cf

mkdir -p oc

if [ $(uname) == "Darwin" ]; then
  curl -L -o oc-mac.zip https://github.com/openshift/origin/releases/download/${OC_VERSION}/openshift-origin-client-tools-${OC_VERSION}-${OC_HASH}-mac.zip
  unzip -o oc-mac.zip -d oc
  rm -f oc-mac.zip
  sudo ifconfig lo0 alias 172.16.123.1
else
  curl -L https://github.com/openshift/origin/releases/download/${OC_VERSION}/openshift-origin-client-tools-${OC_VERSION}-${OC_HASH}-linux-64bit.tar.gz | tar xzC oc --strip-components=1
  sudo ifconfig lo:0 172.16.123.1 netmask 255.255.255.255 up
fi

./oc/oc cluster down
./oc/oc cluster up --routing-suffix=172.16.123.1.nip.io --public-hostname=172.16.123.1