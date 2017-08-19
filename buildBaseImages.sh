#!/bin/bash -x
BUILD_TAG=${BUILD_TAG:-lagoon-local-dev}
BUILD_TAG=$(echo "$BUILD_TAG" | tr '[:upper:]' '[:lower:]')

pushd docker-images

function build {
  docker build $3 --build-arg IMAGE_REPO=$BUILD_TAG -t "$2" -f $1/Dockerfile $1
}

function tag_push {
  docker tag $BUILD_TAG/$1 $2/$1
  docker push $2/$1
}


case "$1" in
  tag_push)
    tag_push 'centos:7' $2
    tag_push 'centos7-node:6' $2
    tag_push 'centos7-node:8' $2
    tag_push 'centos7-node-builder:6' $2
    tag_push 'centos7-node-builder:8' $2
    tag_push 'centos7-nginx:1.12' $2
    tag_push 'centos7-nginx-drupal:1.12' $2
    tag_push 'centos7-php:7.0' $2
    tag_push 'centos7-php-drupal:7.0' $2
    tag_push 'centos7-drupal-builder:7.0' $2
    tag_push 'centos7-mariadb:10.1' $2
    tag_push 'centos7-mariadb-drupal:10.1' $2
    ;;

  *)
    build 'centos:7' "$BUILD_TAG/centos:7" "--pull"
    build 'centos7-node:6' "$BUILD_TAG/centos7-node:6"
    build 'centos7-node:8' "$BUILD_TAG/centos7-node:8"
    build 'centos7-node-builder:6' "$BUILD_TAG/centos7-node-builder:6"
    build 'centos7-node-builder:8' "$BUILD_TAG/centos7-node-builder:8"
    build 'centos7-nginx:1.12' "$BUILD_TAG/centos7-nginx:1.12"
    build 'centos7-nginx-drupal:1.12' "$BUILD_TAG/centos7-nginx-drupal:1.12"
    build 'centos7-php:7.0' "$BUILD_TAG/centos7-php:7.0"
    build 'centos7-php-drupal:7.0' "$BUILD_TAG/centos7-php-drupal:7.0"
    build 'centos7-drupal-builder:7.0' "$BUILD_TAG/centos7-drupal-builder:7.0"
    build 'centos7-mariadb:10.1' "$BUILD_TAG/centos7-mariadb:10.1"
    build 'centos7-mariadb-drupal:10.1' "$BUILD_TAG/centos7-mariadb-drupal:10.1"

esac
