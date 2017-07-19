#!/bin/bash

# Clean up, just to be sure.
rm -rf hiera

# Clone all submodules (should just be hiera for now).
git submodule update --init

# Loop over all remote branches and make them avaiable locally.
for branch in $(git -C hiera branch --all | grep '^\s*remotes' | egrep --invert-match '(:?HEAD|master)$'); do
  git -C hiera branch --track "${branch##*/}" "$branch"
done
