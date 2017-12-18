#!/bin/bash
set -euo pipefail

SERVICE_NAME=galera
SAFE_BRANCH=test
SAFE_SITEGROUP=test
BRANCH=test
SITEGROUP=test
AMAZEEIO_GIT_SHA=test
ROUTER_URL=test

# MYSQL_USER=
MYSQL_USER=test
# MYSQL_PASSWORD=
MYSQL_PASSWORD=test
# MYSQL_DATABASE=
MYSQL_DATABASE=test
MYSQL_ROOT_PASSWORD=changeme

oc process -f /Users/desdrury/Sites/SalsaDigital/bay/docker-images/oc-build-deploy/openshift-templates/mariadb-cluster/template.yml \
    SERVICE_NAME=${SERVICE_NAME} \
    SAFE_BRANCH=${SAFE_BRANCH} \
    SAFE_SITEGROUP=${SAFE_SITEGROUP} \
    BRANCH=${BRANCH} \
    SITEGROUP=${SITEGROUP} \
    AMAZEEIO_GIT_SHA=${AMAZEEIO_GIT_SHA} \
    ROUTER_URL=${ROUTER_URL} \
    MYSQL_USER=${MYSQL_USER} \
    MYSQL_PASSWORD=${MYSQL_PASSWORD} \
    MYSQL_DATABASE=${MYSQL_DATABASE} \
    MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
   --local -o yaml

