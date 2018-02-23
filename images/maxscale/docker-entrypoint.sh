#!/bin/sh
set -xe

mkdir -p /var/log/maxscale

exec maxscale -lstdout -d
