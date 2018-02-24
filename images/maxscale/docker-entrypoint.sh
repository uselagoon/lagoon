#!/bin/sh
set -xe

/bin/ep /etc/maxscale.cnf

exec maxscale -lstdout -d
