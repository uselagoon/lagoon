#!/bin/bash

rm build/$1 || true

make build/$1

docker tag lagoon/$1 registry.172.17.0.2.nip.io:32080/library/lagoon/$1:latest
docker push registry.172.17.0.2.nip.io:32080/library/lagoon/$1:latest

echo " "
echo "Remember to set the following in your helmvalues/local.yaml for the service you've pushed, "
echo "redeploy the relevant helm chart, then restart the service pod"
echo " "
echo "  image:"
echo "    repository: registry.172.17.0.2.nip.io:32080/library/lagoon/$1"
echo "    tag: latest"