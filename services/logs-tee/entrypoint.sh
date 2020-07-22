#!/usr/bin/env bash

# this script:
# - listens on the UDP port given in the first argument (all interfaces)
# - assumes the remaining arguments are UDP endpoints
# - duplicates received traffic to each UDP endpoints
# - ensures that each defined endpoint resolves before starting
# - echoes to STDOUT if $DEBUG is set to "true"

set -euo pipefail
set -x

socat -b 65507 -u "udp-recvfrom:$1,fork" udp-sendto:127.255.255.255:9999,broadcast &

shift

for endpoint in "$@"; do
	while ! nslookup "${endpoint/:[0-9]*/}" &> /dev/null; do
		echo "${endpoint/:[0-9]*/} doesn't resolve. retrying in 2 seconds.."
		sleep 2
	done
	socat -b 65507 -u udp-recvfrom:9999,reuseaddr,fork udp-sendto:$endpoint &
done

if [[ ${DEBUG:-} = true ]]; then
	socat -b 65507 -u udp-recvfrom:9999,reuseaddr,fork - &
fi

wait -n
