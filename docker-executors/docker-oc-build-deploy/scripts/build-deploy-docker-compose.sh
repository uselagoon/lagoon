#!/bin/bash -xe
set -o pipefail


oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f /openshift-templates/configmap.yml \
  -v SAFE_BRANCH="${SAFE_BRANCH}" \
  -v SAFE_SITEGROUP="${SAFE_SITEGROUP}" \
  -v BRANCH="${BRANCH}" \
  -v SITEGROUP="${SITEGROUP}" \
  -v AMAZEEIO_GIT_SHA="${AMAZEEIO_GIT_SHA}" \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -

DOCKER_COMPOSE_YAML=($(cat .amazeeio.yml | shyaml get-value docker-compose-yaml))

SERVICES=($(cat $DOCKER_COMPOSE_YAML | shyaml keys services))

SERVICE_TYPES=()
for SERVICE in "${SERVICES[@]}"
do
  SERVICE_TYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.com\\.amazeeio\\.type custom)

  if [ "$SERVICE_TYPE" == "none" ]; then
    continue
  fi

  SERVICE_TYPES+=("${SERVICE_TYPE}")
done

BUILD_ARGS=()

for SERVICE in "${SERVICES[@]}"
do
  SERVICE_UPPERCASE=$(echo "$SERVICE" | tr '[:lower:]' '[:upper:]')
  SERVICE_TYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.com\\.amazeeio\\.type custom)
  DOCKERFILE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.build.dockerfile false)
  BUILD_CONTEXT=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.build.context .)

  if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
    echo "defined Dockerfile $DOCKERFILE for service $SERVICE not found"; exit 1;
  fi

  . /scripts/exec-build.sh

  # adding the build image to the list of arguments passed into the next image builds
  BUILD_ARGS+=("${SERVICE_UPPERCASE}_IMAGE=${IMAGE}-${SERVICE}")
done

for SERVICE_TYPE in "${SERVICE_TYPES[@]}"
do

  #OVERRIDE_TEMPLATE=$(cat $SERVICES_YAML | shyaml get-value services.$SERVICE.amazeeio.template false)

  #if [ $OVERRIDE_TEMPLATE == "false" ]; then
    OPENSHIFT_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/template.yml"
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "No Template for service type ${SERVICE_TYPE} found"; exit 1;
    fi
  # else
  #   OPENSHIFT_TEMPLATE=$OVERRIDE_TEMPLATE
  #   if [ ! -f $OPENSHIFT_TEMPLATE ]; then
  #     echo "defined template $OPENSHIFT_TEMPLATE for service $SERVICE not found"; exit 1;
  #   fi
  # fi

  . /scripts/exec-openshift-resources.sh
done

for SERVICE in "${SERVICES[@]}"
do

  PUSH=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.amazeeio.com\\.amazeeio\\.push true)
  if [ "$PUSH" == "true" ]; then
    . /scripts/exec-push.sh
  fi

done

for SERVICE_TYPE in "${SERVICE_TYPES[@]}"
do
  . /scripts/exec-monitor-deploy.sh
done


while IFS= read -d '' line; do
    POST_DEPLOY_TASKS+=( "$line" )
done < <(cat .amazeeio.yml | shyaml values-0 tasks.post-deploy.0 | sed "s/^- //")

for POST_DEPLOY_TASK in "${POST_DEPLOY_TASKS[@]}"
do
  . /scripts/exec-post-deploy-tasks.sh
done
