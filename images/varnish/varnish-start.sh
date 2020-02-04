#!/bin/sh
/usr/sbin/varnishd -a $LISTEN -T $MANAGEMENT_LISTEN -F -f /etc/varnish/default.vcl -S /etc/varnish/secret -p http_resp_hdr_len=$HTTP_RESP_HDR_LEN -p http_resp_size=$HTTP_RESP_SIZE -p nuke_limit=$NUKE_LIMIT -s ${CACHE_TYPE},$CACHE_SIZE -j none
