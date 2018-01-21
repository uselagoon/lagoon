#!/bin/bash -e
set -x
OPENSHIFT_PROJECT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

if ! docker -H ${DOCKER_HOST} info &> /dev/null; then
    echo "could not connect to ${DOCKER_HOST}"; exit 1
fi

docker login -u=serviceaccount --password-stdin ${OPENSHIFT_REGISTRY} < /var/run/secrets/kubernetes.io/serviceaccount/token

# Iterates through all images that have the name of the repository we are interested in in it
for FULL_IMAGE in $(docker image ls --format "{{.Repository}}:{{.Tag}}" | grep "${REPOSITORY_TO_UPDATE}/" | grep -v none); do
  IMAGE=(${FULL_IMAGE//// })
  if [ ${#IMAGE[@]} == "3" ]; then
    IMAGE_NO_REPOSITORY=${IMAGE[2]}
  else
    IMAGE_NO_REPOSITORY=${IMAGE[1]}
  fi

  # pull newest version of found image
  docker pull ${FULL_IMAGE} | cat
  # Tag the image with the openshift registry name and the openshift project this container is running
  docker tag ${FULL_IMAGE} ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NO_REPOSITORY}
  # Push to the openshift registry
  docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${IMAGE_NO_REPOSITORY}
done