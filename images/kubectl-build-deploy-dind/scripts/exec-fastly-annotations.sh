#!/bin/bash

# this script is used to work out the fastly annotation overrides that could be defined in the lagoon api

# if no service id is provided in the `.lagoon.yml` which will be present in `ROUTE_FASTLY_SERVICE_ID`
if [ -z "$ROUTE_FASTLY_SERVICE_ID" ]; then
    # then insert the one provided by lagoon in `LAGOON_FASTLY_NOCACHE_SERVICE_ID` if it is available
    if [ ! -z "$LAGOON_FASTLY_NOCACHE_SERVICE_ID" ]; then
        ROUTE_FASTLY_SERVICE_ID=$LAGOON_FASTLY_NOCACHE_SERVICE_ID
        # if the nocache service id was injected by the lagoon builddeploy controller
        # then set the watch status to true so it is set in the ingress annotations
        # if the lagoon builddeploy controller has the fastly service injection disabled
        # then the `LAGOON_FASTLY_NOCACHE_SERVICE_ID` will be empty
        ROUTE_FASTLY_SERVICE_WATCH=true
    fi
fi

# check lagoon api variables for `LAGOON_FASTLY_SERVICE_ID`
# this is supported as `SERVICE_ID:WATCH_STATUS:SECRET_NAME(optional)` eg: "fa23rsdgsdgas:false", "fa23rsdgsdgas:true" or "fa23rsdgsdgas:true:examplecom"
# this will apply to ALL ingresses if one is not specifically defined in the `LAGOON_FASTLY_SERVICE_IDS` environment variable override
# see section `FASTLY SERVICE ID PER INGRESS OVERRIDE` in `build-deploy-docker-compose.sh` for info on `LAGOON_FASTLY_SERVICE_IDS`
if [ ! -z "$LAGOON_PROJECT_VARIABLES" ]; then
    LAGOON_FASTLY_SERVICE_ID_DATA=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_FASTLY_SERVICE_ID") | "\(.value)"'))
    echo $LAGOON_FASTLY_SERVICE_ID_DATA
    if [ ! -z "$LAGOON_FASTLY_SERVICE_ID_DATA" ]; then
        IFS=':' read -ra LAGOON_FASTLY_SERVICE_ID_SPLIT <<< "$LAGOON_FASTLY_SERVICE_ID_DATA"
        if [ -z "${LAGOON_FASTLY_SERVICE_ID_SPLIT[0]}" ] || [ -z "${LAGOON_FASTLY_SERVICE_ID_SPLIT[1]}" ]; then
            echo -e "An override was defined in the lagoon API with LAGOON_FASTLY_SERVICE_ID but one of the components was missing, the format should be FASTLY_SERVICE_ID:WATCH_STATUS"
            exit 1
        fi
        LAGOON_FASTLY_SERVICE_ID=${LAGOON_FASTLY_SERVICE_ID_SPLIT[0]}
        LAGOON_FASTLY_SERVICE_WATCH=${LAGOON_FASTLY_SERVICE_ID_SPLIT[1]}
    fi
fi
if [ ! -z "$LAGOON_ENVIRONMENT_VARIABLES" ]; then
    TEMP_LAGOON_FASTLY_SERVICE_ID_DATA=($(echo $LAGOON_ENVIRONMENT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_FASTLY_SERVICE_ID") | "\(.value)"'))
    if [ ! -z $TEMP_LAGOON_FASTLY_SERVICE_ID_DATA ]; then
        IFS=':' read -ra LAGOON_FASTLY_SERVICE_ID_SPLIT <<< "$TEMP_LAGOON_FASTLY_SERVICE_ID_DATA"
        if [ -z "${LAGOON_FASTLY_SERVICE_ID_SPLIT[0]}" ] || [ -z "${LAGOON_FASTLY_SERVICE_ID_SPLIT[1]}" ]; then
            echo -e "An override was defined in the lagoon API with LAGOON_FASTLY_SERVICE_ID but one of the components was missing, the format should be FASTLY_SERVICE_ID:WATCH_STATUS"
            exit 1
        fi
        LAGOON_FASTLY_SERVICE_ID=${LAGOON_FASTLY_SERVICE_ID_SPLIT[0]}
        LAGOON_FASTLY_SERVICE_WATCH=${LAGOON_FASTLY_SERVICE_ID_SPLIT[1]}
        # if the optional secret name is defined in the colon separated values configure that here
        if [ ! -z ${LAGOON_FASTLY_SERVICE_ID_SPLIT[2]} ]; then
            LAGOON_FASTLY_SERVICE_API_SECRET=${LAGOON_FASTLY_SERVICE_ID_SPLIT[2]}
        fi
    fi
fi

# check the `LAGOON_FASTLY_SERVICE_IDS` to see if we have a domain specific override
# this is useful if all domains are using the nocache service, but you have a specific domain that should use a different service
# and you haven't defined it in the lagoon.yml file
# see section `FASTLY SERVICE ID PER INGRESS OVERRIDE` in `build-deploy-docker-compose.sh` for info on `LAGOON_FASTLY_SERVICE_IDS`
if [ ! -z "$LAGOON_FASTLY_SERVICE_IDS" ]; then
    IFS=',' read -ra LAGOON_FASTLY_SERVICE_IDS_SPLIT <<< "$LAGOON_FASTLY_SERVICE_IDS"
    for LAGOON_FASTLY_SERVICE_ID_DATA in "${LAGOON_FASTLY_SERVICE_IDS_SPLIT[@]}"
    do
        IFS=':' read -ra LAGOON_FASTLY_SERVICE_ID_SPLIT <<< "$LAGOON_FASTLY_SERVICE_ID_DATA"
        if [ -z "${LAGOON_FASTLY_SERVICE_ID_SPLIT[0]}" ] || [ -z "${LAGOON_FASTLY_SERVICE_ID_SPLIT[1]}" ] || [ -z "${LAGOON_FASTLY_SERVICE_ID_SPLIT[2]}" ]; then
            echo -e "An override was defined in the lagoon API with LAGOON_FASTLY_SERVICE_IDS but was not structured correctly, the format should be DOMAIN_NAME:FASTLY_SERVICE_ID:WATCH_STATUS and comma separated for multiples"
            exit 1
        fi
        if [ "${LAGOON_FASTLY_SERVICE_ID_SPLIT[0]}" == "$ROUTE_DOMAIN" ]; then
            LAGOON_FASTLY_SERVICE_ID=${LAGOON_FASTLY_SERVICE_ID_SPLIT[1]}
            LAGOON_FASTLY_SERVICE_WATCH=${LAGOON_FASTLY_SERVICE_ID_SPLIT[2]}
            # if the optional secret name is defined in the colon separated values configure that here
            if [ ! -z ${LAGOON_FASTLY_SERVICE_ID_SPLIT[3]} ]; then
                LAGOON_FASTLY_SERVICE_API_SECRET=${LAGOON_FASTLY_SERVICE_ID_SPLIT[3]}
            fi
        fi
    done
fi