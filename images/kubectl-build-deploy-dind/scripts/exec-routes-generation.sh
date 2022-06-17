#!/bin/bash

set +x

YQ=yq
LAGOONYML=.lagoon.yml

##############################################
### New JSON format for routes that can be defined in an environment variable
##############################################
# cat << EOF > routes.json
# {"routes": [
#     {
#         "domain": "example.com",
#         "service": "nginx",
#         "hsts": "max-age=31536000",
#         "insecure": "Allow",
#         "monitoring-path": "/",
#         "fastly": {
#             "service-id": "123456",
#             "watch": true
#         },
#         "annotations": {
#             "nginx.ingress.kubernetes.io/permanent-redirect": "https://www.example.com$request_uri"
#         }
#     },
#     {
#         "domain": "www.example.com",
#         "service": "nginx",
#         "hsts": "max-age=31536000",
#         "insecure": "Allow",
#         "monitoring-path": "/",
#         "fastly": {
#             "service-id": "123456",
#             "watch": true
#         }
#     }
# ]}
# EOF
#
# When added this variable `LAGOON_ROUTES_JSON` to the specific environment (must be environment, not project),
# the value should be base64 encoded to preserve the formatting of the original JSON
# the best way to generate the base64 encoded version would be to use `jq` to compact the json and then base64 encode that
#
# eg, `cat routes.json | jq -c | base64`
#
# or by using the lagoon-cli, and given a JSON file with the routes in it
# lagoon add variable --project example-project \
#    --environment main \
#    --name LAGOON_ROUTES_JSON \
#    --value $(cat routes.json | jq -c | base64) \
#    --scope build`

function containsElement () {
    local e match="$1"
    shift
    for e
    do
        [[ "$(echo $e | base64 -d | jq -r '.domain')" == "$match" ]] && echo $e && return 0
    done
    return 1
}

##############################################
### Function to convert existing route data from .lagoon.yml into newer
### JSON format used by the merging function and the route generator
##############################################
function routeDataCollection() {
    YAMLPREFIX=${1}
    ROUTES_SERVICE=${2}
    ROUTES_SERVICE_COUNTER=${3}
    ROUTE_DOMAIN_COUNTER=${4}
    ACTIVE_STANDBY=${5}
    if cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER &> /dev/null; then
        ROUTE_DOMAIN=$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER)
        # Route Domains include dots, which need to be esacped via `\.` in order to use them within shyaml
        ROUTE_DOMAIN_ESCAPED=$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER | sed 's/\./\\./g')
        ROUTE_TLS_ACME=$(set -o pipefail; cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.tls-acme true | tr '[:upper:]' '[:lower:]')
        ROUTE_MIGRATE=$(set -o pipefail; cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.migrate ${ACTIVE_STANDBY} | tr '[:upper:]' '[:lower:]')
        ROUTE_INSECURE=$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.insecure Redirect)
        ROUTE_HSTS=$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.hsts null)
        MONITORING_PATH=$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.monitoring-path "/")
        ROUTE_ANNOTATIONS=$(${YQ} -o=json --prettyPrint eval <(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.annotations {}))
        # get the fastly configuration values from ${LAGOONYML}
        if cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.fastly &> /dev/null; then
            ROUTE_FASTLY_SERVICE_ID=$(cat ${LAGOONYML} | shyaml ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.fastly.service-id "")
            ROUTE_FASTLY_SERVICE_API_SECRET=$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.fastly.api-secret-name "")
            ROUTE_FASTLY_SERVICE_WATCH=$(set -o pipefail; cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.fastly.watch false | tr '[:upper:]' '[:lower:]')
        else
            ROUTE_FASTLY_SERVICE_ID=""
            ROUTE_FASTLY_SERVICE_API_SECRET=""
            ROUTE_FASTLY_SERVICE_WATCH=false
        fi
    else
    # Only a value given, assuming some defaults
        ROUTE_DOMAIN=$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER)
        ROUTE_TLS_ACME=true
        ROUTE_MIGRATE=${ACTIVE_STANDBY}
        ROUTE_INSECURE=Redirect
        ROUTE_HSTS=null
        MONITORING_PATH="/"
        ROUTE_ANNOTATIONS="{}"
        ROUTE_FASTLY_SERVICE_ID=""
        ROUTE_FASTLY_SERVICE_API_SECRET=""
        ROUTE_FASTLY_SERVICE_WATCH=false
    fi

    FASTLY_JSON_FMT='{"service-id":"%s","api-secret-name":"%s","watch":%s}\n'
    FASTLY_JSON=$(printf "$FASTLY_JSON_FMT" "$ROUTE_FASTLY_SERVICE_ID" "$ROUTE_FASTLY_SERVICE_API_SECRET" "$ROUTE_FASTLY_SERVICE_WATCH")

    ROUTE_JSON_FMT='{"domain":"%s","service":"%s","tls-acme":%s,"hsts":"%s", "insecure": "%s", "monitoring-path": "%s", "fastly": %s, "annotations": %s}\n'
    ROUTE_JSON=$(printf "$ROUTE_JSON_FMT" "$ROUTE_DOMAIN" "$ROUTES_SERVICE" "$ROUTE_TLS_ACME" "$ROUTE_HSTS" "$ROUTE_INSECURE" "$MONITORING_PATH" "$FASTLY_JSON" "$ROUTE_ANNOTATIONS")
    echo ${ROUTE_JSON}
}


##############################################
### Function that actually generates the templates for routes
### This is to use the new routes JSON to simplify route creation
##############################################
function generateRoutes() {
    LAGOON_FINAL_ROUTES=${1}
    ACTIVE_STANDBY=${2}
    ROUTE_DATA=$(${YQ} eval <(echo ${LAGOON_FINAL_ROUTES}))

    MONITORING_ENABLED="false"
    ROUTES_SERVICE_COUNTER=0
    while [ -n "$(echo "${ROUTE_DATA}" | shyaml keys routes.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; do
        ROUTES_SERVICE=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.service)
        ROUTE_DOMAIN=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.domain)
        # Route Domains include dots, which need to be esacped via `\.` in order to use them within shyaml
        ROUTE_DOMAIN_ESCAPED=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.domain | sed 's/\./\\./g')
        ROUTE_TLS_ACME=$(set -o pipefail; echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.tls-acme true | tr '[:upper:]' '[:lower:]')
        ROUTE_MIGRATE=$(set -o pipefail; echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.migrate ${ACTIVE_STANDBY} | tr '[:upper:]' '[:lower:]')
        ROUTE_INSECURE=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.insecure Redirect)
        ROUTE_HSTS=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.hsts null)
        MONITORING_PATH=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.monitoring-path "/")
        ROUTE_ANNOTATIONS=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.annotations {})
        # get the fastly configuration values from .lagoon.yml
        if echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.fastly &> /dev/null; then
            ROUTE_FASTLY_SERVICE_ID=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.fastly.service-id "")
            ROUTE_FASTLY_SERVICE_API_SECRET=$(echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.fastly.api-secret-name "")
            ROUTE_FASTLY_SERVICE_WATCH=$(set -o pipefail; echo "${ROUTE_DATA}" | shyaml get-value routes.$ROUTES_SERVICE_COUNTER.fastly.watch false | tr '[:upper:]' '[:lower:]')
        else
            ROUTE_FASTLY_SERVICE_ID=""
            ROUTE_FASTLY_SERVICE_API_SECRET=""
            ROUTE_FASTLY_SERVICE_WATCH=false
        fi

        # work out if there are any lagoon api variable overrides for the annotations that are being added
        . /kubectl-build-deploy/scripts/exec-fastly-annotations.sh

        # if we get any other populated service id overrides in any of the steps in exec-fastly-annotations.sh
        # make it available to the ingress creation here by overriding what may be defined in the lagoon.yml
        # `LAGOON_FASTLY_SERVICE_ID` is created in the exec-fastly-annotations.sh script
        if [ ! -z "$LAGOON_FASTLY_SERVICE_ID" ]; then
            ROUTE_FASTLY_SERVICE_ID=$LAGOON_FASTLY_SERVICE_ID
            ROUTE_FASTLY_SERVICE_WATCH=$LAGOON_FASTLY_SERVICE_WATCH
            if [ ! -z $LAGOON_FASTLY_SERVICE_API_SECRET ]; then
            ROUTE_FASTLY_SERVICE_API_SECRET=$LAGOON_FASTLY_SERVICE_API_SECRET
            fi
        fi

        # Create the fastly values required
        FASTLY_ARGS=()
        if [ ! -z "$ROUTE_FASTLY_SERVICE_ID" ]; then
            FASTLY_ARGS+=(--set fastly.serviceId=${ROUTE_FASTLY_SERVICE_ID})
            if [ ! -z "$ROUTE_FASTLY_SERVICE_API_SECRET" ]; then
            if contains $FASTLY_API_SECRETS "${FASTLY_API_SECRET_PREFIX}${ROUTE_FASTLY_SERVICE_API_SECRET}"; then
                FASTLY_ARGS+=(--set fastly.apiSecretName=${FASTLY_API_SECRET_PREFIX}${ROUTE_FASTLY_SERVICE_API_SECRET})
            else
                echo "$ROUTE_FASTLY_SERVICE_API_SECRET requested, but not found in .lagoon.yml file"; exit 1;
            fi
            fi
            ROUTE_FASTLY_SERVICE_WATCH=true
        fi

        touch /kubectl-build-deploy/${ROUTE_DOMAIN}-values.yaml
        ${YQ} eval '{"annotations": .}' <(echo "$ROUTE_ANNOTATIONS") > /kubectl-build-deploy/${ROUTE_DOMAIN}-values.yaml

        # ${ROUTE_DOMAIN} is used as a helm release name which be max 53 characters long.
        # So we need some logic to make sure it's always max 53 characters
        if [[ ${#ROUTE_DOMAIN} -gt 53 ]] ; then
            # Trim the route domain to 47 characters, and add an 5 character hash of the domain at the end
            # this gives a total of 53 characters
            INGRESS_NAME="${ROUTE_DOMAIN:0:47}"
            INGRESS_NAME="${INGRESS_NAME%%.*}-$(echo "${ROUTE_DOMAIN}" | md5sum | cut -f 1 -d " " | cut -c 1-5)"
        else
            INGRESS_NAME=${ROUTE_DOMAIN}
        fi

        # The very first found route is set as MAIN_CUSTOM_ROUTE
        if [ -z "${MAIN_CUSTOM_ROUTE+x}" ]; then
            MAIN_CUSTOM_ROUTE=$INGRESS_NAME

            # if we are in production we enabled monitoring for the main custom route
            if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
            MONITORING_ENABLED="true"
            fi

        fi

        ROUTE_SERVICE=$ROUTES_SERVICE

        # Print the values for some reason?
        cat /kubectl-build-deploy/${ROUTE_DOMAIN}-values.yaml

        helm template ${INGRESS_NAME} \
            /kubectl-build-deploy/helmcharts/custom-ingress \
            --set host="${ROUTE_DOMAIN}" \
            --set service="${ROUTE_SERVICE}" \
            --set tls_acme="${ROUTE_TLS_ACME}" \
            --set insecure="${ROUTE_INSECURE}" \
            --set hsts="${ROUTE_HSTS}" \
            --set routeMigrate="${ROUTE_MIGRATE}" \
            --set ingressmonitorcontroller.enabled="${MONITORING_ENABLED}" \
            --set ingressmonitorcontroller.path="${MONITORING_PATH}" \
            --set ingressmonitorcontroller.alertContacts="${MONITORING_ALERTCONTACT}" \
            --set ingressmonitorcontroller.statuspageId="${MONITORING_STATUSPAGEID}" \
                "${FASTLY_ARGS[@]}" --set fastly.watch="${ROUTE_FASTLY_SERVICE_WATCH}" \
            -f /kubectl-build-deploy/values.yaml -f /kubectl-build-deploy/${ROUTE_DOMAIN}-values.yaml  "${HELM_ARGUMENTS[@]}" > $YAML_FOLDER/${ROUTE_DOMAIN}.yaml

        MONITORING_ENABLED="false" # disabling a possible enabled monitoring again

        let ROUTES_SERVICE_COUNTER=ROUTES_SERVICE_COUNTER+1
    done
}

##############################################
### Calculate any active/standby routes
##############################################
# we need to check for production routes for active/standby if they are defined, as these will get migrated between environments as required
if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
    PRODUCTION_ROUTES_JSON_FMT='{"routes": []}'
    ROUTES_SERVICE_COUNTER=0
    if [ "${BRANCH//./\\.}" == "${ACTIVE_ENVIRONMENT}" ]; then
        YMLPREFIX="production_routes.active.routes"
        if [ -n "$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; then
        while [ -n "$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; do
            ROUTES_SERVICE=$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER)
            ROUTE_DOMAIN_COUNTER=0
            while [ -n "$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER 2> /dev/null)" ]; do
                LAGOON_ROUTE_JSON=$(routeDataCollection "${YAMLPREFIX}" "${ROUTES_SERVICE}" "${ROUTES_SERVICE_COUNTER}" "${ROUTE_DOMAIN_COUNTER}" true)
                PRODUCTION_ROUTES_JSON_FMT=$(echo $PRODUCTION_ROUTES_JSON_FMT | jq -r --argjson LAGOON_ROUTE_JSON "$LAGOON_ROUTE_JSON" '.routes |= . + [$LAGOON_ROUTE_JSON]')
                let ROUTE_DOMAIN_COUNTER=ROUTE_DOMAIN_COUNTER+1
            done
            let ROUTES_SERVICE_COUNTER=ROUTES_SERVICE_COUNTER+1
        done
        fi
    fi
    if [ "${BRANCH//./\\.}" == "${STANDBY_ENVIRONMENT}" ]; then
        YMLPREFIX="production_routes.standby.routes"
        if [ -n "$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; then
        while [ -n "$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; do
            ROUTES_SERVICE=$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER)
            ROUTE_DOMAIN_COUNTER=0
            while [ -n "$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER 2> /dev/null)" ]; do
                LAGOON_ROUTE_JSON=$(routeDataCollection "${YAMLPREFIX}" "${ROUTES_SERVICE}" "${ROUTES_SERVICE_COUNTER}" "${ROUTE_DOMAIN_COUNTER}" true)
                PRODUCTION_ROUTES_JSON_FMT=$(echo $PRODUCTION_ROUTES_JSON_FMT | jq -r --argjson LAGOON_ROUTE_JSON "$LAGOON_ROUTE_JSON" '.routes |= . + [$LAGOON_ROUTE_JSON]')
                let ROUTE_DOMAIN_COUNTER=ROUTE_DOMAIN_COUNTER+1
            done
            let ROUTES_SERVICE_COUNTER=ROUTES_SERVICE_COUNTER+1
        done
        fi
    fi
    if [ "${ROUTES_SERVICE_COUNTER}" != "0" ]; then
        ### Run the generation function to create all the kubernetes resources etc
        ### Merging of active/standby routes with environment variabled defined routes is not currently supported
        echo "Generating the production_routes templates"
        generateRoutes "$(echo "${PRODUCTION_ROUTES_JSON_FMT}" | jq -r)" true
    fi
fi

##############################################
### Calculate any standard routes from the `.lagoon.yml`
##############################################
ROUTES_JSON_FMT='{"routes": []}'

ROUTES_SERVICE_COUNTER=0
YMLPREFIX="${PROJECT}.environments.${BRANCH//./\\.}.routes"
if [ -n "$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; then
    while [ -n "$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; do
        ROUTES_SERVICE=$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER)
        ROUTE_DOMAIN_COUNTER=0
        while [ -n "$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER 2> /dev/null)" ]; do
            LAGOON_ROUTE_JSON=$(routeDataCollection "${YAMLPREFIX}" "${ROUTES_SERVICE}" "${ROUTES_SERVICE_COUNTER}" "${ROUTE_DOMAIN_COUNTER}" false)
            ROUTES_JSON_FMT=$(echo $ROUTES_JSON_FMT | jq -r --argjson LAGOON_ROUTE_JSON "$LAGOON_ROUTE_JSON" '.routes |= . + [$LAGOON_ROUTE_JSON]')
            let ROUTE_DOMAIN_COUNTER=ROUTE_DOMAIN_COUNTER+1
        done
        let ROUTES_SERVICE_COUNTER=ROUTES_SERVICE_COUNTER+1
    done
else
    YMLPREFIX="environments.${BRANCH//./\\.}.routes"
    while [ -n "$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; do
        ROUTES_SERVICE=$(cat ${LAGOONYML} | shyaml keys ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER)
        ROUTE_DOMAIN_COUNTER=0
        while [ -n "$(cat ${LAGOONYML} | shyaml get-value ${YMLPREFIX}.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER 2> /dev/null)" ]; do
            LAGOON_ROUTE_JSON=$(routeDataCollection "${YAMLPREFIX}" "${ROUTES_SERVICE}" "${ROUTES_SERVICE_COUNTER}" "${ROUTE_DOMAIN_COUNTER}" false)
            ROUTES_JSON_FMT=$(echo $ROUTES_JSON_FMT | jq -r --argjson LAGOON_ROUTE_JSON "$LAGOON_ROUTE_JSON" '.routes |= . + [$LAGOON_ROUTE_JSON]')
            let ROUTE_DOMAIN_COUNTER=ROUTE_DOMAIN_COUNTER+1
        done
        let ROUTES_SERVICE_COUNTER=ROUTES_SERVICE_COUNTER+1
    done
fi

##############################################
### Merge any routes that have been defined in the API/EnvVar
### over the top of what is in the `.lagoon.yml` file
##############################################
FINAL_ROUTES_JSON='{"routes": []}'
# these are routes from the .lagoon.yml file
LAGOON_YML_ROUTES=($(echo "${ROUTES_JSON_FMT}" | jq -r '.routes | .[] | @base64'))

# these are routes that are in the api as "environment" environment variables (not project)
if [ ! -z "$LAGOON_ENVIRONMENT_VARIABLES" ]; then
    LAGOON_ROUTES_JSON=$(echo $LAGOON_ENVIRONMENT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_ROUTES_JSON") | "\(.value)"' | base64 -d)
fi

MERGE_ROUTES_ARR=($(echo "${LAGOON_ROUTES_JSON}" | jq -r '.routes | .[] | @base64'))

# check if any of the routes in the merge routes array exist in the existing routes
# if they don't, then add them to the new routes format so that the ingress is created
for MERGE_ROUTE in "${MERGE_ROUTES_ARR[@]}"; do
    _jq() {
        echo ${MERGE_ROUTE} | base64 -d | jq -r ${1}
    }
    if ! containsElement "$(_jq '.domain')" "${LAGOON_YML_ROUTES[@]}" > /dev/null; then
        # add the domain to the new routes format
        echo "Adding route $(_jq '.domain') from LAGOON_ROUTES_JSON to processing list"
        FINAL_ROUTES_JSON=$(echo $FINAL_ROUTES_JSON | jq -r --argjson LAGOON_ROUTE_JSON "$(echo $(_jq))" '.routes |= . + [$LAGOON_ROUTE_JSON]')
    fi
done

# now check if the routes contain any of the ones to merge
# if they do, then merge whats in the merging json over the top of the existing json
for YAML_ROUTE in "${LAGOON_YML_ROUTES[@]}"; do
    _jq() {
        echo ${YAML_ROUTE} | base64 -d | jq -r ${1}
    }
    if containsElement "$(_jq '.domain')" "${MERGE_ROUTES_ARR[@]}" > /dev/null; then
        # merge the domain over the existing one
        echo "Merging route $(_jq '.domain') from LAGOON_ROUTES_JSON on top of the '.lagoon.yml', adding to processing list"
        MERGED_JSON=$(jq -s '.[0] * .[1]' <(_jq) <(containsElement "$(_jq '.domain')" "${MERGE_ROUTES_ARR[@]}" | base64 -d | jq -r))
        FINAL_ROUTES_JSON=$(echo $FINAL_ROUTES_JSON | jq -r --argjson LAGOON_ROUTE_JSON "$(echo ${MERGED_JSON})" '.routes |= . + [$LAGOON_ROUTE_JSON]')
    fi
    if ! containsElement "$(_jq '.domain')" "${MERGE_ROUTES_ARR[@]}" > /dev/null; then
        # add the domain to the new routes format
        echo "Adding route $(_jq '.domain') from '.lagoon.yml' to processing list"
        FINAL_ROUTES_JSON=$(echo $FINAL_ROUTES_JSON | jq -r --argjson LAGOON_ROUTE_JSON "$(echo $(_jq))" '.routes |= . + [$LAGOON_ROUTE_JSON]')
    fi
done

### Add the merged or to be created routes into a configmap
echo "${FINAL_ROUTES_JSON}" | jq -r > /kubectl-build-deploy/routes.json
echo "Updating lagoon-routes configmap with the newly generated routes JSON"
if kubectl -n ${NAMESPACE} get configmap lagoon-routes &> /dev/null; then
    # if the key does exist, then nuke it and put the new key
    kubectl -n ${NAMESPACE} create configmap lagoon-routes --from-file=lagoon-routes=/kubectl-build-deploy/routes.json -o yaml --dry-run=client | kubectl replace -f -
else
    # create it
    kubectl -n ${NAMESPACE} create configmap lagoon-routes --from-file=lagoon-routes=/kubectl-build-deploy/routes.json
fi

### Run the generation function to create all the kubernetes resources etc
echo "Generating the routes templates"
generateRoutes "$(cat /kubectl-build-deploy/routes.json | jq -r)" false
set -x
