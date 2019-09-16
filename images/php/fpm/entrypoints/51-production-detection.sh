#!/bin/sh

if [[ -z "${PHP_ERROR_REPORTING}" ]]; then
    if [[ ${LAGOON_ENVIRONMENT_TYPE} == "production" ]]; then
        export PHP_ERROR_REPORTING="E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE"
    fi
fi
