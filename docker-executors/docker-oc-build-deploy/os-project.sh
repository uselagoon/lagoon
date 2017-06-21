#!/bin/bash

# take $1 and make it match the following.
# Invalid value: "BLAH": must match the regex [a-z0-9]([-a-z0-9]*[a-z0-9])? (e.g. 'my-name' or '123-abc')

p=$1
p=`tr '[:upper:]' '[:lower:]' <<<"$p"`
p=`echo $p |sed 's/[^0-9a-z-]/-/g'`

echo $p
