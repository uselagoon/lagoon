#!/usr/bin/env bash

# this script:
# - listens on the UDP port given in the first argument (all interfaces)
# - assumes the remaining arguments are UDP endpoints
# - duplicates received traffic to each UDP endpoints
# - ensures that each defined endpoint resolves before starting

set -euo pipefail
set -x

cmd="socat - udp-recvfrom:$1,fork | tee"

shift

for endpoint in "$@"; do
	while ! nslookup "${endpoint/:[0-9]*/}" &> /dev/null; do
		echo "${endpoint/:[0-9]*/} doesn't resolve. retrying in 2 seconds.."
		sleep 2
	done
	cmd="$cmd >(socat - udp-sendto:$endpoint)"
done

eval "$cmd"
