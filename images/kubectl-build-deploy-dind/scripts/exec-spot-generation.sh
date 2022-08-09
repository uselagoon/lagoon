#!/bin/bash

# spot instance configuration

# some service types can properly support multiple replicas under spot, this list defines them
SPOT_REPLICA_TYPES=nginx,nginx-persistent,nginx-php,nginx-php-persistent
SPOT_SERVICE_TYPES=""

if [[ "$(featureFlag SPOT_INSTANCE_PRODUCTION)" = enabled && "${ENVIRONMENT_TYPE}" == "production" ]] ||
[[ "$(featureFlag SPOT_INSTANCE_DEVELOPMENT)" = enabled && "${ENVIRONMENT_TYPE}" == "development" ]]; then
    if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
        # production environments can support different spot instance types than development environments
        SPOT_INSTANCE_PRODUCTION_TYPES="$(featureFlag SPOT_INSTANCE_PRODUCTION_TYPES)"
        if [ ! -z "${SPOT_INSTANCE_PRODUCTION_TYPES}" ]; then
            SPOT_SERVICE_TYPES="${SPOT_INSTANCE_PRODUCTION_TYPES}"
        fi
        SPOT_INSTANCE_PRODUCTION_CRONJOB_TYPES="$(featureFlag SPOT_INSTANCE_PRODUCTION_CRONJOB_TYPES)"
        if [ ! -z "${SPOT_INSTANCE_PRODUCTION_CRONJOB_TYPES}" ]; then
            SPOT_SERVICE_CRONJOB_TYPES="${SPOT_INSTANCE_PRODUCTION_CRONJOB_TYPES}"
        fi
    else
        SPOT_INSTANCE_DEVELOPMENT_TYPES="$(featureFlag SPOT_INSTANCE_DEVELOPMENT_TYPES)"
        if [ ! -z "${SPOT_INSTANCE_DEVELOPMENT_TYPES}" ]; then
            SPOT_SERVICE_TYPES="${SPOT_INSTANCE_DEVELOPMENT_TYPES}"
        fi
        SPOT_INSTANCE_DEVELOPMENT_CRONJOB_TYPES="$(featureFlag SPOT_INSTANCE_DEVELOPMENT_CRONJOB_TYPES)"
        if [ ! -z "${SPOT_INSTANCE_DEVELOPMENT_CRONJOB_TYPES}" ]; then
            SPOT_SERVICE_CRONJOB_TYPES="${SPOT_INSTANCE_DEVELOPMENT_CRONJOB_TYPES}"
        fi
    fi

    # set deployment spot configurations
    if [[ ${SPOT_SERVICE_TYPES} =~ (^|,)"${SERVICE_TYPE}"(,|$) ]]; then
        HELM_SET_VALUES+=(--set "useSpot=true")
        # spot on production gets 2 replicas if the service type is in the supported SPOT_REPLICA_TYPES list
        if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
            if [[ ${SPOT_REPLICA_TYPES} =~ (^|,)"${SERVICE_TYPE}"(,|$) ]]; then
                HELM_SET_VALUES+=(--set "replicaCount=2")
            fi
        fi
        echo -e "\
tolerations:
- key: lagoon.sh/spot
  effect: NoSchedule
  operator: Equal
  value: \"true\"
" >> /kubectl-build-deploy/${SERVICE_NAME}-values.yaml
    fi

    # set cronjob spot configurations
    if [[ ${SPOT_SERVICE_CRONJOB_TYPES} =~ (^|,)"${SERVICE_TYPE}"(,|$) ]]; then
        HELM_SET_VALUES+=(--set "cronjobUseSpot=true")
        # spot on production gets 2 replicas if the service type is in the supported SPOT_REPLICA_TYPES list
        if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
            if [[ ${SPOT_REPLICA_TYPES} =~ (^|,)"${SERVICE_TYPE}"(,|$) ]]; then
                HELM_SET_VALUES+=(--set "replicaCount=2")
            fi
        fi
        echo -e "\
cronjobTolerations:
- key: lagoon.sh/spot
  effect: NoSchedule
  operator: Equal
  value: \"true\"
" >> /kubectl-build-deploy/${SERVICE_NAME}-values.yaml
    fi
fi