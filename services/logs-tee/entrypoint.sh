#!/usr/bin/env bash

# this script:
# - listens on the UDP port given in the first argument (all interfaces)
# - assumes the remaining arguments are UDP endpoints
# - duplicates received traffic to each UDP endpoints
# - ensures that each defined endpoint resolves before starting
# - echoes to STDOUT if $TRACE is set to "true"
# - enables debug logging in the sending socats if $DEBUG is set to "true"

set -euo pipefail
set -x

socat -b 65507 -u "udp-recv:$1,reuseaddr" udp-sendto:127.255.255.255:9999,broadcast &

shift

for endpoint in "$@"; do
	socat ${DEBUG:+-dd} -b 65507 -u udp-recv:9999,reuseaddr udp-sendto:$endpoint &
done

if [[ ${TRACE:-} = true ]]; then
	socat -b 65507 -u udp-recv:9999,reuseaddr - &
fi

wait -n
