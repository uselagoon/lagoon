#!/bin/bash
set -x
set -eo pipefail

REMOTE=$1
PR_HEAD_SHA=$2
PR_BASE_SHA=$3

git init .
git config remote.origin.url $REMOTE
git fetch --tags --progress $REMOTE +refs/heads/*:refs/remotes/origin/*

git checkout --force "${3}"
git merge ${2}

git submodule update --init --recursive --jobs=6
