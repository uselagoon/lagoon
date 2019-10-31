#!/bin/sh

set -e

export EXT_ENDPOINT=$HARBOR_NGINX_ENDPOINT

exec "/harbor/harbor_core"
#sudo -E -u \#10000 "$@"