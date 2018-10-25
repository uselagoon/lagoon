#!/bin/bash


# if LOGSDB_UI_URL is not defined, we try to load it from LAGOON_ROUTES
if [[ -z ${LOGSDB_UI_URL+x} ]]; then
    REGEX="(https?://logs-db-ui[0-9A-Za-z\.-]+)"

    if [[ $LAGOON_ROUTES =~ $REGEX ]]; then
        export LOGSDB_UI_URL=${BASH_REMATCH[1]}
    else
        echo "Could not load logs-db-ui URL from LAGOON_ROUTES, please define via LOGSDB_UI_URL env variable"
        exit 1
    fi
fi

