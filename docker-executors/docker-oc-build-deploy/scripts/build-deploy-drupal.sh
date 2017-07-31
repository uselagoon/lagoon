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

SERVICES_YAML="/flavors/drupal/services.yml"

SERVICES=($(cat $SERVICES_YAML | shyaml keys services))

SERVICE_TYPES=()
for SERVICE in "${SERVICES[@]}"
do
  SERVICE_TYPE=$(cat $SERVICES_YAML | shyaml get-value services.$SERVICE.amazeeio.type custom)

  if [ "$SERVICE_TYPE" == "none" ]; then
    continue
  fi

  SERVICE_TYPES+=("${SERVICE_TYPE}")
done

BUILD_ARGS=()

for SERVICE in "${SERVICES[@]}"
do
  SERVICE_UPPERCASE=$(echo "$SERVICE" | tr '[:lower:]' '[:upper:]')
  SERVICE_TYPE=$(cat $SERVICES_YAML | shyaml get-value services.$SERVICE.amazeeio.type custom)
  OVERRIDE_DOCKERFILE=$(cat $SERVICES_YAML | shyaml get-value services.$SERVICE.build.dockerfile false)
  BUILD_CONTEXT=$(cat $SERVICES_YAML | shyaml get-value services.$SERVICE.build.context .)

  if [ $OVERRIDE_DOCKERFILE == "false" ]; then
    DOCKERFILE="/flavors/drupal/${SERVICE}/Dockerfile"
    if [ ! -f $DOCKERFILE ]; then
      echo "No Dockerfile for service type ${SERVICE} found"; exit 1;
    fi
    mkdir -p $BUILD_CONTEXT/.tmp/
    cp $DOCKERFILE $BUILD_CONTEXT/.tmp/Dockerfile.$SERVICE
    DOCKERFILE=$BUILD_CONTEXT/.tmp/Dockerfile.$SERVICE
  else
    DOCKERFILE=$OVERRIDE_DOCKERFILE
    if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
      echo "defined Dockerfile $DOCKERFILE for service $SERVICE not found"; exit 1;
    fi
  fi

  . /scripts/exec-build.sh

  # adding the build image to the list of arguments passed into the next image builds
  BUILD_ARGS+=("${SERVICE_UPPERCASE}_IMAGE=${IMAGE}-${SERVICE}")
done

for SERVICE_TYPE in "${SERVICE_TYPES[@]}"
do

  #OVERRIDE_TEMPLATE=$(cat $SERVICES_YAML | shyaml get-value services.$SERVICE.amazeeio.template false)

  #if [ $OVERRIDE_TEMPLATE == "false" ]; then
    OPENSHIFT_TEMPLATE="/flavors/drupal/${SERVICE_TYPE}/template.yml"
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

  PUSH=$(cat $SERVICES_YAML | shyaml get-value services.$SERVICE.amazeeio.push True)
  if [ "$PUSH" == "True" ]; then
    . /scripts/exec-push.sh
  fi

done

for SERVICE_TYPE in "${SERVICE_TYPES[@]}"
do
  . /scripts/exec-monitor-deploy.sh
done


while IFS= read -d '' line; do
    POST_DEPLOY_TASKS+=( "$line" )
done < <(cat $SERVICES_YAML | shyaml get-values-0 tasks.post_deploy)

for POST_DEPLOY_TASK in "${POST_DEPLOY_TASKS[@]}"
do
  . /scripts/exec-post-deploy-tasks.sh
done
