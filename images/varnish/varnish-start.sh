#!/bin/sh
/usr/sbin/varnishd -a :8080 -T :6082 -F -f /etc/varnish/default.vcl -S /etc/varnish/secret -p http_resp_hdr_len=$HTTP_RESP_HDR_LEN -p http_resp_size=$HTTP_RESP_SIZE -p nuke_limit=$NUKE_LIMIT -s malloc,$CACHE_SIZE
