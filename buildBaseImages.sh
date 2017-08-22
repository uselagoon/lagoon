#!/bin/bash -x
BUILD_TAG=${BUILD_TAG:-lagoon-local-dev}
BUILD_TAG=$(echo "$BUILD_TAG" | tr '[:upper:]' '[:lower:]')

pushd docker-images

function build {
  IMAGENAME=$1
  DOCKER_BUILD_PARAM=$2
  docker build $DOCKER_BUILD_PARAM --build-arg IMAGE_REPO=$BUILD_TAG -t "$BUILD_TAG/$IMAGENAME" -f $IMAGENAME/Dockerfile $IMAGENAME
}

function tag_push {
  IMAGENAME=$1
  REPO=$2
  IMAGESUFFIX=$3
  docker tag $BUILD_TAG/$IMAGENAME $REPO/$IMAGENAME$IMAGESUFFIX
  docker push $IMAGEPREFIX$IMAGENAME
}


case "$1" in
  tag_push)
    tag_push 'centos:7' $2 $3
    tag_push 'centos7-node:6' $2 $3
    tag_push 'centos7-node:8' $2 $3
    tag_push 'centos7-node-builder:6' $2 $3
    tag_push 'centos7-node-builder:8' $2 $3
    tag_push 'oc' $2 $3
    tag_push 'oc-build-deploy' $2 $3
    ;;

  *)
    build 'centos:7' "--pull"
    build 'centos7-node:6'
    build 'centos7-node:8'
    build 'centos7-node-builder:6'
    build 'centos7-node-builder:8'
    build 'oc'
    build 'oc-build-deploy'

esac