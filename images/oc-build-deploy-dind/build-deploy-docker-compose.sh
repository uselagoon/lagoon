#!/bin/bash

containsValue () {
  local e
  for e in "${@:2}"; do [[ "$e" == "$1" ]] && return 0; done
  return 1
}

##############################################
### PREPARATION
##############################################

# Load path of docker-compose that should be used
DOCKER_COMPOSE_YAML=($(cat .lagoon.yml | shyaml get-value docker-compose-yaml))

# Load all Services that are defined
SERVICES=($(cat $DOCKER_COMPOSE_YAML | shyaml keys services))

# Figure out which services should we handle
SERVICE_TYPES=()
IMAGES=()
for SERVICE in "${SERVICES[@]}"
do
  # The name of the service can be overridden, if not we use the actual servicename
  SERVICE_NAME=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.name default)
  if [ "$SERVICE_NAME" == "default" ]; then
    SERVICE_NAME=$SERVICE
  fi

  # Load the servicetype. If it's "none" we will not care about this service at all
  SERVICE_TYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.type custom)
  if [ "$SERVICE_TYPE" == "none" ]; then
    continue
  fi

  # We build all images
  IMAGES+=("${SERVICE}")

  # Create an array with all Service Types, Names and Original Service Name
  SERVICE_TYPES+=("${SERVICE_TYPE}:${SERVICE_NAME}:${SERVICE}")
done

##############################################
### BUILD IMAGES
##############################################

BUILD_ARGS=()
for IMAGE_NAME in "${IMAGES[@]}"
do
  # We need the Image Name uppercase sometimes, so we create that here
  IMAGE_NAME_UPPERCASE=$(echo "$IMAGE_NAME" | tr '[:lower:]' '[:upper:]')

  # To prevent clashes of ImageNames during parallel builds, we give all Images a Temporary name
  TEMPORARY_IMAGE_NAME="${OPENSHIFT_PROJECT}-${IMAGE_NAME}"

  DOCKERFILE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.build.dockerfile false)
  if [ $DOCKERFILE == "false" ]; then
    # No Dockerfile defined, assuming to download the Image directly

    PULL_IMAGE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.image false)
    if [ $PULL_IMAGE == "false" ]; then
      echo "No Dockerfile or Image for service ${IMAGE_NAME} defined"; exit 1;
    fi

    # allow to overwrite image that we pull
    OVERRIDE_IMAGE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.labels.lagoon\\.image false)
    if [ ! $OVERRIDE_IMAGE == "false" ]; then
      # expand environment variables from ${OVERRIDE_IMAGE}
      PULL_IMAGE=$(echo "${OVERRIDE_IMAGE}" | envsubst)
    fi

    . /scripts/exec-pull-tag.sh

  else
    # Dockerfile defined, load the context and build it

    BUILD_CONTEXT=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.build.context .)
    if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
      echo "defined Dockerfile $DOCKERFILE for service $IMAGE_NAME not found"; exit 1;
    fi

    . /scripts/exec-build.sh
  fi

  # adding the build image to the list of arguments passed into the next image builds
  BUILD_ARGS+=(--build-arg ${IMAGE_NAME_UPPERCASE}_IMAGE=${TEMPORARY_IMAGE_NAME})
done

##############################################
### CREATE OPENSHIFT SERVICES AND ROUTES
##############################################

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do

  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[1]}
  SERVICE=${SERVICE_TYPES_ENTRY_SPLIT[2]}

  OPENSHIFT_SERVICES_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/services.yml"
  if [ -f $OPENSHIFT_SERVICES_TEMPLATE ]; then
    OPENSHIFT_TEMPLATE=$OPENSHIFT_SERVICES_TEMPLATE
    . /scripts/exec-openshift-resources.sh
  fi

  OPENSHIFT_ROUTES_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/routes.yml"
  if [ -f $OPENSHIFT_ROUTES_TEMPLATE ]; then

    # The very first generated route is set as MAIN_GENERATED_ROUTE
    if [ -z "${MAIN_GENERATED_ROUTE+x}" ]; then
      MAIN_GENERATED_ROUTE=$SERVICE_NAME
    fi

    OPENSHIFT_TEMPLATE=$OPENSHIFT_ROUTES_TEMPLATE
    . /scripts/exec-openshift-resources.sh
  fi
done

##############################################
### CUSTOM ROUTES FROM .lagoon.yml
##############################################

# Two while loops as we have multiple services that want routes and each service has multiple routes
ROUTES_SERVICE_COUNTER=0
while [ -n "$(cat .lagoon.yml | shyaml keys environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; do
  ROUTES_SERVICE=$(cat .lagoon.yml | shyaml keys environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER)

  ROUTE_DOMAIN_COUNTER=0
  while [ -n "$(cat .lagoon.yml | shyaml get-value environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER 2> /dev/null)" ]; do
    # Routes can either be a key (when the have additional settings) or just a value
    if cat .lagoon.yml | shyaml keys environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER &> /dev/null; then
      ROUTE_DOMAIN=$(cat .lagoon.yml | shyaml keys environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER)
      # Route Domains include dots, which need to be esacped via `\.` in order to use them within shyaml
      ROUTE_DOMAIN_ESCAPED=$(cat .lagoon.yml | shyaml keys environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER | sed 's/\./\\./g')
      ROUTE_TLS_ACME=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.tls-acme true)
      ROUTE_INSECURE=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.insecure Redirect)
    else
      # Only a value given, assuming some defaults
      ROUTE_DOMAIN=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER)
      ROUTE_TLS_ACME=true
      ROUTE_INSECURE=Redirect
    fi

    # The very first found route is set as MAIN_CUSTOM_ROUTE
    if [ -z "${MAIN_CUSTOM_ROUTE+x}" ]; then
      MAIN_CUSTOM_ROUTE=$ROUTE_DOMAIN
    fi

    ROUTE_SERVICE=$ROUTES_SERVICE

    . /scripts/exec-openshift-create-route.sh

    let ROUTE_DOMAIN_COUNTER=ROUTE_DOMAIN_COUNTER+1
  done

  let ROUTES_SERVICE_COUNTER=ROUTES_SERVICE_COUNTER+1
done


##############################################
### PROJECT WIDE ENV VARIABLES
##############################################

# If we have a custom route, we use that as main route
if [ "$MAIN_CUSTOM_ROUTE" ]; then
  MAIN_ROUTE_NAME=$MAIN_CUSTOM_ROUTE
# no custom route, we use the first generated route
elif [ "$MAIN_GENERATED_ROUTE" ]; then
  MAIN_ROUTE_NAME=$MAIN_GENERATED_ROUTE
fi

# Load the found main routes with correct schema
if [ "$MAIN_ROUTE_NAME" ]; then
  ROUTE=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get route "$MAIN_ROUTE_NAME" -o=go-template --template='{{if .spec.tls.termination}}https://{{else}}http://{{end}}{{.spec.host}}')
fi

# Load all routes with correct schema and comma separated
ROUTES=$(oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get routes -o=go-template --template='{{range $index, $route := .items}}{{if $index}},{{end}}{{if $route.spec.tls.termination}}https://{{else}}http://{{end}}{{$route.spec.host}}{{end}}')

# Generate a Config Map with project wide env variables
oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f /openshift-templates/configmap.yml \
  -p SAFE_BRANCH="${SAFE_BRANCH}" \
  -p SAFE_PROJECT="${SAFE_PROJECT}" \
  -p BRANCH="${BRANCH}" \
  -p PROJECT="${PROJECT}" \
  -p ENVIRONMENT_TYPE="${ENVIRONMENT_TYPE}" \
  -p ROUTE="${ROUTE}" \
  -p ROUTES="${ROUTES}" \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -


##############################################
### CREATE PVC, DEPLOYMENTS AND CRONJOBS
##############################################

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do
  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[1]}
  SERVICE=${SERVICE_TYPES_ENTRY_SPLIT[2]}

  # Some Templates need additonal Parameters, like where persistent storage can be found.
  TEMPLATE_PARAMETERS=()
  PERSISTENT_STORAGE_PATH=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent false)

  if [ ! $PERSISTENT_STORAGE_PATH == "false" ]; then
    TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_PATH="${PERSISTENT_STORAGE_PATH}")

    PERSISTENT_STORAGE_CLASS=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent\\.class false)
    if [ ! $PERSISTENT_STORAGE_CLASS == "false" ]; then
      TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_CLASS="${PERSISTENT_STORAGE_CLASS}")
    fi

    PERSISTENT_STORAGE_NAME=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent\\.name false)
    if [ ! $PERSISTENT_STORAGE_NAME == "false" ]; then
      TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_NAME="${PERSISTENT_STORAGE_NAME}")
    fi

    PERSISTENT_STORAGE_SIZE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.persistent\\.size false)
    if [ ! $PERSISTENT_STORAGE_SIZE == "false" ]; then
      TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_SIZE="${PERSISTENT_STORAGE_SIZE}")
    fi
  fi

  # Generate PVC if service type defines one
  OPENSHIFT_SERVICES_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/pvc.yml"
  if [ -f $OPENSHIFT_SERVICES_TEMPLATE ]; then
    OPENSHIFT_TEMPLATE=$OPENSHIFT_SERVICES_TEMPLATE
    . /scripts/exec-openshift-create-pvc.sh
  fi

  # Deployment template can be overwritten in docker-compose
  OVERRIDE_TEMPLATE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.template false)

  if [ $OVERRIDE_TEMPLATE == "false" ]; then
    OPENSHIFT_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/deployment.yml"
    if [ -f $OPENSHIFT_TEMPLATE ]; then
      . /scripts/exec-openshift-resources.sh
    fi
  else
    OPENSHIFT_TEMPLATE=$OVERRIDE_TEMPLATE
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "defined template $OPENSHIFT_TEMPLATE for service $SERVICE_TYPE not found"; exit 1;
    else
      . /scripts/exec-openshift-resources.sh
    fi
  fi

  # Generate cronjobs if service type defines them
  OPENSHIFT_SERVICES_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/cronjobs.yml"
  if [ -f $OPENSHIFT_SERVICES_TEMPLATE ]; then
    OPENSHIFT_TEMPLATE=$OPENSHIFT_SERVICES_TEMPLATE
    . /scripts/exec-openshift-resources.sh
  fi

  ### CUSTOM CRONJOBS

  # Save the current deployment template parameters so we can reuse them for cronjobs
  DEPLOYMENT_TEMPLATE_PARAMETERS=("${TEMPLATE_PARAMETERS[@]}")

  CRONJOB_COUNTER=0
  while [ -n "$(cat .lagoon.yml | shyaml keys cronjobs.$CRONJOB_COUNTER 2> /dev/null)" ]
  do

    CRONJOB_SERVICE=$(cat .lagoon.yml | shyaml get-value cronjobs.$CRONJOB_COUNTER.service)

    # Only implement the cronjob for the services we are currently handling
    if [ $CRONJOB_SERVICE == $SERVICE ]; then

      # loading original $TEMPLATE_PARAMETERS as multiple cronjobs use the same values
      TEMPLATE_PARAMETERS=("${DEPLOYMENT_TEMPLATE_PARAMETERS[@]}")

      # Creating a save name (special characters removed )
      CRONJOB_NAME=$(cat .lagoon.yml | shyaml get-value cronjobs.$CRONJOB_COUNTER.name | sed "s/[^[:alnum:]-]/-/g" | sed "s/^-//g")
      CRONJOB_SCHEDULE=$(cat .lagoon.yml | shyaml get-value cronjobs.$CRONJOB_COUNTER.schedule)
      CRONJOB_COMMAND=$(cat .lagoon.yml | shyaml get-value cronjobs.$CRONJOB_COUNTER.command)

      TEMPLATE_PARAMETERS+=(-p CRONJOB_NAME="${CRONJOB_NAME}")
      TEMPLATE_PARAMETERS+=(-p CRONJOB_SCHEDULE="${CRONJOB_SCHEDULE}")
      TEMPLATE_PARAMETERS+=(-p CRONJOB_COMMAND="${CRONJOB_COMMAND}")

      OPENSHIFT_TEMPLATE="/openshift-templates/${SERVICE_TYPE}/custom-cronjob.yml"
      if [ ! -f $OPENSHIFT_TEMPLATE ]; then
        echo "No cronjob Template for service type ${SERVICE_TYPE} found"; exit 1;
      fi

      . /scripts/exec-openshift-resources.sh
    fi

    let CRONJOB_COUNTER=CRONJOB_COUNTER+1
  done

done


##############################################
### PUSH IMAGES TO OPENSHIFT REGISTRY
##############################################

for IMAGE_NAME in "${IMAGES[@]}"
do
  # Before the push the temporary name is resolved to the future tag with the registry in the image name
  TEMPORARY_IMAGE_NAME="${OPENSHIFT_PROJECT}-${IMAGE_NAME}"
  . /scripts/exec-push.sh
done


##############################################
### WAIT FOR POST-ROLLOUT TO BE FINISHED
##############################################

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do

  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[1]}

  SERVICE_ROLLOUT_TYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$SERVICE.labels.lagoon\\.rollout deploymentconfigs)

  if [ ! $SERVICE_ROLLOUT_TYPE == "false" ]; then
    . /scripts/exec-monitor-deploy.sh
  fi
done


##############################################
### RUN POST-ROLLOUT tasks defined in .lagoon.yml
##############################################

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
