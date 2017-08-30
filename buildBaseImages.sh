#!/bin/bash -ex
BUILD_TAG=${BUILD_TAG:-lagoon-local-dev}
BUILD_TAG=$(echo "$BUILD_TAG" | tr '[:upper:]' '[:lower:]')

pushd docker-images

function build {
  FOLDER=$1
  IMAGENAME=$2
  DOCKER_BUILD_PARAM=$3
  docker build $DOCKER_BUILD_PARAM --build-arg IMAGE_REPO=$BUILD_TAG -t "$BUILD_TAG/$IMAGENAME" -f $FOLDER/Dockerfile $FOLDER
}

function tag_push {
  IMAGENAME=$1
  REPO=$2
  IMAGESUFFIX=$3
  docker tag $BUILD_TAG/$IMAGENAME $REPO/$IMAGENAME$IMAGESUFFIX
  docker push $REPO/$IMAGENAME$IMAGESUFFIX
}


case "$1" in
  tag_push)
    tag_push 'centos:7' $2 $3
    tag_push 'centos7-node:6' $2 $3
    tag_push 'centos7-node:8' $2 $3
    tag_push 'centos7-node-builder:6' $2 $3
    tag_push 'centos7-node-builder:8' $2 $3
    tag_push 'oc:latest' $2 $3
    tag_push 'oc-build-deploy:latest' $2 $3
    ;;

  *)
    build 'centos/7'                'centos:7' '--pull'
    build 'centos7-node/6'          'centos7-node:6'
    build 'centos7-node/8'          'centos7-node:8'
    build 'centos7-node-builder/6'  'centos7-node-builder:6'
    build 'centos7-node-builder/8'  'centos7-node-builder:8'
    build 'oc'                      'oc:latest'
    build 'oc-build-deploy'         'oc-build-deploy:latest'

esac