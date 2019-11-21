#!/usr/bin/env bash

# this script:
# - takes an arbitrary number of arguments
# - assumes each argument is a UDP endpoint
# - listens on UDP 0.0.0.0:5140
# - duplicates received traffic to the UDP endpoints

set -x

cmd="socat - udp-recvfrom:5140,fork | tee"

for endpoint in "$@"; do
	while ! nslookup "${endpoint/:[0-9]*/}" &> /dev/null; do
		echo "${endpoint/:[0-9]*/} doesn't resolve. retrying in 2 seconds.."
		sleep 2
	done
	cmd="$cmd >(socat - udp-sendto:$endpoint)"
done

eval "$cmd"
