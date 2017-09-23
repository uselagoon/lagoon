#!/bin/bash -x
set -eo pipefail

OPENSHIFT_REGISTRY=$OUTPUT_REGISTRY
OPENSHIFT_PROJECT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

if [ "$CI_USE_OPENSHIFT_REGISTRY" == "true" ]; then
  CI_OVERRIDE_IMAGE_REPO=${OUTPUT_REGISTRY}/lagoon
else
  CI_OVERRIDE_IMAGE_REPO=""
fi

/scripts/git-checkout-pull.sh "$SOURCE_REPOSITORY" "$GIT_REF"

AMAZEEIO_GIT_SHA=`git rev-parse HEAD`

if [ ! -f .amazeeio.yml ]; then
  echo "no .amazeeio.yml file found"; exit 1;
fi

DOCKER_REGISTRY_TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)

docker login -u=jenkins -p="${DOCKER_REGISTRY_TOKEN}" ${OPENSHIFT_REGISTRY}

DEPLOYER_TOKEN=$(cat /var/run/secrets/lagoon/deployer/token)

oc login --insecure-skip-tls-verify --token="${DEPLOYER_TOKEN}" https://kubernetes.default.svc

USE_DOCKER_COMPOSE_YAML=($(cat .amazeeio.yml | shyaml get-value docker-compose-yaml false))

if [ ! $USE_DOCKER_COMPOSE_YAML == "false" ]; then
  . /build-deploy-docker-compose.sh
  exit
fi

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f /openshift-templates/configmap.yml \
  -v SAFE_BRANCH="${SAFE_BRANCH}" \
  -v SAFE_SITEGROUP="${SAFE_SITEGROUP}" \
  -v BRANCH="${BRANCH}" \
  -v SITEGROUP="${SITEGROUP}" \
  -v AMAZEEIO_GIT_SHA="${AMAZEEIO_GIT_SHA}" \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -

SERVICES=($(cat .amazeeio.yml | shyaml keys services))

# export the services so Jenkins can load them afterwards to check the deployments
cat .amazeeio.yml | shyaml keys services | tr '\n' ',' | sed 's/,$//' > .amazeeio.services

BUILD_ARGS=()

for SERVICE_NAME in "${SERVICES[@]}"
do
  SERVICE_UPPERCASE=$(echo "$SERVICE_NAME" | tr '[:lower:]' '[:upper:]')
  DOCKERFILE=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.build.dockerfile false)
  PULL_IMAGE=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.image false)
  DO_BUILD=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.amazeeio.build true)
  BUILD_CONTEXT=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.build.context .)

  if [ $DO_BUILD == "false" ]; then
    continue
  fi

  IMAGE_NAME=$SERVICE_NAME

  if [ $DOCKERFILE == "false" ]; then
    if [ $PULL_IMAGE == "false" ]; then
      echo "No Dockerfile or Image for service type ${SERVICE_NAME} defined"; exit 1;
    fi

    . /scripts/exec-pull-tag.sh

  else
    if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
      echo "defined Dockerfile $DOCKERFILE for service $SERVICE_NAME not found"; exit 1;
    fi

    . /scripts/exec-build.sh
  fi

  # adding the build image to the list of arguments passed into the next image builds
  BUILD_ARGS+=("${SERVICE_UPPERCASE}_IMAGE=${SERVICE_NAME}")
done

for SERVICE_NAME in "${SERVICES[@]}"
do
  SERVICE_TYPE=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.amazeeio.type custom)
  OVERRIDE_TEMPLATE=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.amazeeio.template false)

  if [ $OVERRIDE_TEMPLATE == "false" ]; then
    OPENSHIFT_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/template.yml"
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "No Template for service type ${SERVICE_TYPE} found"; exit 1;
    fi
  else
    OPENSHIFT_TEMPLATE=$OVERRIDE_TEMPLATE
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "defined template $OPENSHIFT_TEMPLATE for service $SERVICE_NAME not found"; exit 1;
    fi
  fi

  . /scripts/exec-openshift-resources.sh
done

for SERVICE_NAME in "${SERVICES[@]}"
do
  DO_BUILD=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.amazeeio.build true)
  if [ $DO_BUILD == "false" ]; then
    continue
  fi
  IMAGE_NAME=$SERVICE_NAME
  . /scripts/exec-push.sh
done

for SERVICE_NAME in "${SERVICES[@]}"
do
  . /scripts/exec-monitor-deploy.sh
done
