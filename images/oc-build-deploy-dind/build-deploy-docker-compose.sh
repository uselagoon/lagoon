#!/bin/bash

containsValue () {
  local e
  for e in "${@:2}"; do [[ "$e" == "$1" ]] && return 0; done
  return 1
}

function join_by { local d=$1; shift; echo -n "$1"; shift; printf "%s" "${@/#/$d}"; }

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f /openshift-templates/configmap.yml \
  -v SAFE_BRANCH="${SAFE_BRANCH}" \
  -v SAFE_PROJECT="${SAFE_PROJECT}" \
  -v BRANCH="${BRANCH}" \
  -v PROJECT="${PROJECT}" \
  -v LAGOON_GIT_SHA="${LAGOON_GIT_SHA}" \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -

DOCKER_COMPOSE_YAML=($(cat .lagoon.yml | shyaml get-value docker-compose-yaml))

SERVICES=($(cat $DOCKER_COMPOSE_YAML | shyaml keys services))

SERVICE_TYPES=()
IMAGES=()
for SERVICE in "${SERVICES[@]}"
do
  SERVICE_TYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.type custom)
  SERVICE_NAME=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.name default)

  if [ "$SERVICE_NAME" == "default" ]; then
    SERVICE_NAME=$SERVICE
  fi

  if [ "$SERVICE_TYPE" == "none" ]; then
    continue
  fi

  IMAGES+=("${SERVICE}")

  # # Check if the servicetype already has been added to the SERVICE_TYPES array
  # if [ containsValue "${SERVICE_TYPE}:${SERVICE_NAME}" "${SERVICE_TYPES[@]}"]; then
  #   continue
  # fi

  SERVICE_TYPES+=("${SERVICE_TYPE}:${SERVICE_NAME}:${SERVICE}")
done


BUILD_ARGS=()
for IMAGE_NAME in "${IMAGES[@]}"
do
  IMAGE_NAME_UPPERCASE=$(echo "$IMAGE_NAME" | tr '[:lower:]' '[:upper:]')
  DOCKERFILE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.build.dockerfile false)
  PULL_IMAGE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.image false)
  OVERRIDE_IMAGE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.labels.lagoon\\.image false)
  BUILD_CONTEXT=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.build.context .)

  TEMPORARY_IMAGE_NAME="${OPENSHIFT_PROJECT}-${IMAGE_NAME}"

  if [ $DOCKERFILE == "false" ]; then
    if [ $PULL_IMAGE == "false" ]; then
      echo "No Dockerfile or Image for service ${IMAGE_NAME} defined"; exit 1;
    fi

    # allow to overwrite image that we pull
    if [ ! $OVERRIDE_IMAGE == "false" ]; then
      PULL_IMAGE=$OVERRIDE_IMAGE
    fi

    . /scripts/exec-pull-tag.sh

  else
    if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
      echo "defined Dockerfile $DOCKERFILE for service $IMAGE_NAME not found"; exit 1;
    fi

    . /scripts/exec-build.sh
  fi

  # adding the build image to the list of arguments passed into the next image builds
  BUILD_ARGS+=("${IMAGE_NAME_UPPERCASE}_IMAGE=${TEMPORARY_IMAGE_NAME}")

done

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do

  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[1]}
  SERVICE=${SERVICE_TYPES_ENTRY_SPLIT[2]}

  OVERRIDE_TEMPLATE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.template false)

  if [ $OVERRIDE_TEMPLATE == "false" ]; then
    OPENSHIFT_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/template.yml"
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "No Template for service type ${SERVICE_TYPE} found"; exit 1;
    fi
  else
    OPENSHIFT_TEMPLATE=$OVERRIDE_TEMPLATE
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "defined template $OPENSHIFT_TEMPLATE for service $SERVICE_TYPE not found"; exit 1;
    fi
  fi

  TEMPLATE_PARAMETERS=()

  PERSISTENT_STORAGE_PATH=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent false)

  if [ ! $PERSISTENT_STORAGE_PATH == "false" ]; then
    TEMPLATE_PARAMETERS+=("PERSISTENT_STORAGE_PATH=${PERSISTENT_STORAGE_PATH}")

    PERSISTENT_STORAGE_CLASS=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent\\.class false)
    if [ ! $PERSISTENT_STORAGE_CLASS == "false" ]; then
      TEMPLATE_PARAMETERS+=("PERSISTENT_STORAGE_CLASS=${PERSISTENT_STORAGE_CLASS}")
    fi

    PERSISTENT_STORAGE_NAME=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent\\.name false)
    if [ ! $PERSISTENT_STORAGE_NAME == "false" ]; then
      TEMPLATE_PARAMETERS+=("PERSISTENT_STORAGE_NAME=${PERSISTENT_STORAGE_NAME}")
    fi

    PERSISTENT_STORAGE_SIZE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent\\.size false)
    if [ ! $PERSISTENT_STORAGE_SIZE == "false" ]; then
      TEMPLATE_PARAMETERS+=("PERSISTENT_STORAGE_SIZE=${PERSISTENT_STORAGE_SIZE}")
    fi
  fi

  . /scripts/exec-openshift-resources.sh
done

for IMAGE_NAME in "${IMAGES[@]}"
do
  TEMPORARY_IMAGE_NAME="${OPENSHIFT_PROJECT}-${IMAGE_NAME}"
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
while [ -n "$(cat .lagoon.yml | shyaml keys tasks.post-rollout.$COUNTER 2> /dev/null)" ]
do
  TASK_TYPE=$(cat .lagoon.yml | shyaml keys tasks.post-rollout.$COUNTER)
  echo $TASK_TYPE
  case "$TASK_TYPE" in
    run)
        COMMAND=$(cat .lagoon.yml | shyaml get-value tasks.post-rollout.$COUNTER.$TASK_TYPE.command)
        SERVICE_NAME=$(cat .lagoon.yml | shyaml get-value tasks.post-rollout.$COUNTER.$TASK_TYPE.service)
        . /scripts/exec-post-rollout-tasks-run.sh
        ;;
    *)
        echo "Task Type ${TASK_TYPE} not implemented"; exit 1;

  esac

  let COUNTER=COUNTER+1
done
