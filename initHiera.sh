#!/bin/bash

git submodule update --init

for branch in $(git -C hiera branch --all | grep '^\s*remotes' | egrep --invert-match '(:?HEAD|master)$'); do
  git -C hiera branch --track "${branch##*/}" "$branch"
done
