#!/bin/bash -ex

# REF: can be a:
# a sha: a7789dc5e6960bb2250ae39d7e7145b632c44c77
# a tag: 1.0.0
# or a branch, prefixed by 'origin/': origin/branch2

REMOTE=$1
REF=$2

git rev-parse --is-inside-work-tree || git init .
git config remote.origin.url $REMOTE
git fetch --depth=10 --tags --progress $REMOTE +refs/heads/*:refs/remotes/origin/*

git checkout --force "${REF}"
