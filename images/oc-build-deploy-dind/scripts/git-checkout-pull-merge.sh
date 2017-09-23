#!/bin/bash

REMOTE=$1
PR_HEAD_SHA=$2
PR_BASE_SHA=$3

git init .
git config remote.origin.url $REMOTE
git fetch --depth=10 --tags --progress $REMOTE +refs/heads/*:refs/remotes/origin/*

git checkout --force "${REF}"
