#!/bin/bash -xe
set -o pipefail

containsValue () {
  local e
  for e in "${@:2}"; do [[ "$e" == "$1" ]] && return 0; done
  return 1
}

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
  SERVICE_NAME=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.com\\.amazeeio\\.name default)

  if [ "$SERVICE_NAME" == "default" ]; then
    SERVICE_NAME=$SERVICE
  fi

  if [ "$SERVICE_TYPE" == "none" ]; then
    continue
  fi

  # # Check if the servicetype already has been added to the SERVICE_TYPES array
  # if [ containsValue "${SERVICE_TYPE}:${SERVICE_NAME}" "${SERVICE_TYPES[@]}"]; then
  #   continue
  # fi

  SERVICE_TYPES+=("${SERVICE_TYPE}:${SERVICE_NAME}")
done

IMAGES=()
for SERVICE in "${SERVICES[@]}"
do
  IMAGES+=("${SERVICE}")
done


BUILD_ARGS=()
for IMAGE_NAME in "${IMAGES[@]}"
do
  IMAGE_NAME_UPPERCASE=$(echo "$IMAGE_NAME" | tr '[:lower:]' '[:upper:]')
  DOCKERFILE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.build.dockerfile false)
  BUILD_CONTEXT=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.build.context .)

  if [ $DOCKERFILE == "false" ]; then
    echo "No Dockerfile for service ${IMAGE_NAME} defined"; exit 1;
  else
    if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
      echo "defined Dockerfile $DOCKERFILE for service $IMAGE_NAME not found"; exit 1;
    fi
  fi

  IMAGE_TEMPORARY_NAME=${IMAGE}-${IMAGE_NAME}

  . /scripts/exec-build.sh

  # adding the build image to the list of arguments passed into the next image builds
  BUILD_ARGS+=("${IMAGE_NAME_UPPERCASE}_IMAGE=${IMAGE_TEMPORARY_NAME}")
done

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do

  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[1]}

  # OVERRIDE_TEMPLATE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.com\\.amazeeio\\.template false)

  # if [ $OVERRIDE_TEMPLATE == "false" ]; then
    OPENSHIFT_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/template.yml"
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "No Template for service type ${SERVICE_TYPE} found"; exit 1;
    fi
  # else
  #   OPENSHIFT_TEMPLATE=$OVERRIDE_TEMPLATE
  #   if [ ! -f $OPENSHIFT_TEMPLATE ]; then
  #     echo "defined template $OPENSHIFT_TEMPLATE for service $SERVICE_TYPE not found"; exit 1;
  #   fi
  # fi

  . /scripts/exec-openshift-resources.sh
done

for IMAGE_NAME in "${IMAGES[@]}"
do

  IMAGE_TEMPORARY_NAME=${IMAGE}-${IMAGE_NAME}
  . /scripts/exec-push.sh

done

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do

  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[1]}

  . /scripts/exec-monitor-deploy.sh
done


COUNTER=0
while [ -n "$(cat .amazeeio.yml | shyaml keys tasks.post-deploy.$COUNTER 2> /dev/null)" ]
do
  TASK_TYPE=$(cat .amazeeio.yml | shyaml keys tasks.post-deploy.$COUNTER)
  echo $TASK_TYPE
  case "$TASK_TYPE" in
    run)
        COMMAND=$(cat .amazeeio.yml | shyaml get-value tasks.post-deploy.$COUNTER.$TASK_TYPE.command)
        SERVICE_NAME=$(cat .amazeeio.yml | shyaml get-value tasks.post-deploy.$COUNTER.$TASK_TYPE.service)
        . /scripts/exec-post-deploy-tasks-run.sh
        ;;
    *)
        echo "Task Type ${TASK_TYPE} not implemented"; exit 1;

  esac

  let COUNTER=COUNTER+1
done

