#!/bin/sh

set -e

# if HARBOR_NGINX_ENDPOINT is not defined, we try to load it from LAGOON_ROUTES
if [[ -z ${HARBOR_NGINX_ENDPOINT+x} ]]; then
    REGEX="(https?://harbor[0-9A-Za-z\.-]+)"

    if [[ $LAGOON_ROUTES =~ $REGEX ]]; then
        export HARBOR_NGINX_ENDPOINT=${BASH_REMATCH[1]}
    else
        echo "Could not load harbor URL from LAGOON_ROUTES, please define via HARBOR_NGINX_ENDPOINT env variable"
        exit 1
    fi
fi

export EXT_ENDPOINT=$HARBOR_NGINX_ENDPOINT

exec "/harbor/harbor_core"
#sudo -E -u \#10000 "$@"