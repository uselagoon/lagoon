#!/bin/sh

if [[ ${LAGOON_ENVIRONMENT_TYPE} == "production" && ( -z "${production_notices}" || $production_notices == "true" ) ]]; then
    export PHP_ERROR_REPORTING="E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE"
else
    export PHP_ERROR_REPORTING="E_ALL & ~E_DEPRECATED & ~E_STRICT"
fi
