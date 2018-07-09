#!/bin/bash

function outputToYaml() {
  set +x
  IFS=''
  while read data; do
    echo "$data" >> /oc-build-deploy/lagoon/${YAML_CONFIG_FILE}.yml;
  done;
  # Inject YAML document separator
  echo "---" >> /oc-build-deploy/lagoon/${YAML_CONFIG_FILE}.yml;
  set -x
}

##############################################
### PREPARATION
##############################################

# Load path of docker-compose that should be used
DOCKER_COMPOSE_YAML=($(cat .lagoon.yml | shyaml get-value docker-compose-yaml))

DEPLOY_TYPE=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.deploy-type default)

# Load all Services that are defined
COMPOSE_SERVICES=($(cat $DOCKER_COMPOSE_YAML | shyaml keys services))

# Figure out which services should we handle
SERVICE_TYPES=()
IMAGES=()
NATIVE_CRONJOB_CLEANUP_ARRAY=()
declare -A MAP_DEPLOYMENT_SERVICETYPE_TO_IMAGENAME
declare -A MAP_SERVICE_TYPE_TO_COMPOSE_SERVICE
declare -A MAP_SERVICE_NAME_TO_IMAGENAME
declare -A IMAGES_PULL
declare -A IMAGES_BUILD
for COMPOSE_SERVICE in "${COMPOSE_SERVICES[@]}"
do
  # The name of the service can be overridden, if not we use the actual servicename
  SERVICE_NAME=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.name default)
  if [ "$SERVICE_NAME" == "default" ]; then
    SERVICE_NAME=$COMPOSE_SERVICE
  fi

  # Load the servicetype. If it's "none" we will not care about this service at all
  SERVICE_TYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.type custom)

  # Allow the servicetype to be overriden by environment in .lagoon.yml
  ENVIRONMENT_SERVICE_TYPE_OVERRIDE=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH}.types.$SERVICE_NAME false)
  if [ ! $ENVIRONMENT_SERVICE_TYPE_OVERRIDE == "false" ]; then
    SERVICE_TYPE=$ENVIRONMENT_SERVICE_TYPE_OVERRIDE
  fi

  if [ "$SERVICE_TYPE" == "none" ]; then
    continue
  fi

  # For DeploymentConfigs with multiple Services inside (like nginx-php), we allow to define the service type of within the
  # deploymentconfig via lagoon.deployment.servicetype. If this is not set we use the Compose Service Name
  DEPLOYMENT_SERVICETYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.deployment\\.servicetype default)
  if [ "$DEPLOYMENT_SERVICETYPE" == "default" ]; then
    DEPLOYMENT_SERVICETYPE=$COMPOSE_SERVICE
  fi

  # The ImageName is the same as the Name of the Docker Compose ServiceName
  IMAGE_NAME=$COMPOSE_SERVICE

  # Generate List of Images to build
  IMAGES+=("${IMAGE_NAME}")

  # Map Deployment ServiceType to the ImageName
  MAP_DEPLOYMENT_SERVICETYPE_TO_IMAGENAME["${SERVICE_NAME}:${DEPLOYMENT_SERVICETYPE}"]="${IMAGE_NAME}"

  # Create an array with all Service Names and Types if it does not exist yet
  if [[ ! " ${SERVICE_TYPES[@]} " =~ " ${SERVICE_NAME}:${SERVICE_TYPE} " ]]; then
    SERVICE_TYPES+=("${SERVICE_NAME}:${SERVICE_TYPE}")
  fi

  # ServiceName and Type to Original Service Name Mapping, but only once per Service name and Type,
  # as we have original services that appear twice (like in the case of nginx-php)
  if [[ ! "${MAP_SERVICE_TYPE_TO_COMPOSE_SERVICE["${SERVICE_NAME}:${SERVICE_TYPE}"]+isset}" ]]; then
    MAP_SERVICE_TYPE_TO_COMPOSE_SERVICE["${SERVICE_NAME}:${SERVICE_TYPE}"]="${COMPOSE_SERVICE}"
  fi

  # ServiceName to ImageName mapping, but only once as we have original services that appear twice (like in the case of nginx-php)
  # these will be handled via MAP_DEPLOYMENT_SERVICETYPE_TO_IMAGENAME
  if [[ ! "${MAP_SERVICE_NAME_TO_IMAGENAME["${SERVICE_NAME}"]+isset}" ]]; then
    MAP_SERVICE_NAME_TO_IMAGENAME["${SERVICE_NAME}"]="${IMAGE_NAME}"
  fi

done

##############################################
### BUILD IMAGES
##############################################

# we only need to build images for pullrequests and branches, but not during a TUG build
if [[ ( "$TYPE" == "pullrequest"  ||  "$TYPE" == "branch" ) && ! $THIS_IS_TUG == "true" ]]; then

  BUILD_ARGS=()
  BUILD_ARGS+=(--build-arg IMAGE_REPO="${CI_OVERRIDE_IMAGE_REPO}")
  BUILD_ARGS+=(--build-arg LAGOON_GIT_SHA="${LAGOON_GIT_SHA}")
  BUILD_ARGS+=(--build-arg LAGOON_GIT_BRANCH="${BRANCH}")
  BUILD_ARGS+=(--build-arg LAGOON_PROJECT="${PROJECT}")
  BUILD_ARGS+=(--build-arg LAGOON_BUILD_TYPE="${TYPE}")

  if [ "$TYPE" == "pullrequest" ]; then
    BUILD_ARGS+=(--build-arg LAGOON_PR_HEAD_BRANCH="${PR_HEAD_BRANCH}")
    BUILD_ARGS+=(--build-arg LAGOON_PR_HEAD_SHA="${PR_HEAD_SHA}")
    BUILD_ARGS+=(--build-arg LAGOON_PR_BASE_BRANCH="${PR_BASE_BRANCH}")
    BUILD_ARGS+=(--build-arg LAGOON_PR_BASE_SHA="${PR_BASE_SHA}")
    BUILD_ARGS+=(--build-arg LAGOON_PR_TITLE="${PR_TITLE}")
  fi

  for IMAGE_NAME in "${IMAGES[@]}"
  do

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

      # Add the images we should pull to the IMAGES_PULL array, they will later be tagged from dockerhub
      IMAGES_PULL["${IMAGE_NAME}"]="${PULL_IMAGE}"

    else
      # Dockerfile defined, load the context and build it

      # We need the Image Name uppercase sometimes, so we create that here
      IMAGE_NAME_UPPERCASE=$(echo "$IMAGE_NAME" | tr '[:lower:]' '[:upper:]')


      # To prevent clashes of ImageNames during parallel builds, we give all Images a Temporary name
      TEMPORARY_IMAGE_NAME="${OPENSHIFT_PROJECT}-${IMAGE_NAME}"

      BUILD_CONTEXT=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$IMAGE_NAME.build.context .)
      if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
        echo "defined Dockerfile $DOCKERFILE for service $IMAGE_NAME not found"; exit 1;
      fi

      . /oc-build-deploy/scripts/exec-build.sh

      # Keep a list of the images we have built, as we need to push them to the OpenShift Registry later
      IMAGES_BUILD["${IMAGE_NAME}"]="${TEMPORARY_IMAGE_NAME}"

      # adding the build image to the list of arguments passed into the next image builds
      BUILD_ARGS+=(--build-arg ${IMAGE_NAME_UPPERCASE}_IMAGE=${TEMPORARY_IMAGE_NAME})
    fi

  done

fi

# if $DEPLOY_TYPE is tug we just push the images to the defined docker registry and create a clone
# of ourselves and push it into `lagoon-tug` image which is then executed in the destination openshift
# If though this is the actual tug deployment in the destination openshift, we don't run this
if [[ $DEPLOY_TYPE == "tug" && ! $THIS_IS_TUG == "true" ]]; then

  . /oc-build-deploy/tug/tug-build-push.sh

  # exit here, we are done
  exit
fi

##############################################
### CREATE OPENSHIFT SERVICES AND ROUTES
##############################################

YAML_CONFIG_FILE="services-routes"

ROUTES_INSECURE=$(cat .lagoon.yml | shyaml get-value routes.insecure Allow)

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do
  echo "=== BEGIN route processing for service ${SERVICE_TYPES_ENTRY} ==="
  echo "=== OPENSHIFT_SERVICES_TEMPLATE=${OPENSHIFT_SERVICES_TEMPLATE} "
  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  TEMPLATE_PARAMETERS=()

  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[1]}

  SERVICE_TYPE_OVERRIDE=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH}.types.$SERVICE_NAME false)
  if [ ! $SERVICE_TYPE_OVERRIDE == "false" ]; then
    SERVICE_TYPE=$SERVICE_TYPE_OVERRIDE
  fi

  OPENSHIFT_SERVICES_TEMPLATE="/oc-build-deploy/openshift-templates/${SERVICE_TYPE}/services.yml"
  if [ -f $OPENSHIFT_SERVICES_TEMPLATE ]; then
    OPENSHIFT_TEMPLATE=$OPENSHIFT_SERVICES_TEMPLATE
    .  /oc-build-deploy/scripts/exec-openshift-resources.sh
  fi

  OPENSHIFT_ROUTES_TEMPLATE="/oc-build-deploy/openshift-templates/${SERVICE_TYPE}/routes.yml"
  if [ -f $OPENSHIFT_ROUTES_TEMPLATE ]; then

    # The very first generated route is set as MAIN_GENERATED_ROUTE
    if [ -z "${MAIN_GENERATED_ROUTE+x}" ]; then
      MAIN_GENERATED_ROUTE=$SERVICE_NAME
    fi

    OPENSHIFT_TEMPLATE=$OPENSHIFT_ROUTES_TEMPLATE

    TEMPLATE_PARAMETERS+=(-p ROUTES_INSECURE="${ROUTES_INSECURE}")
    .  /oc-build-deploy/scripts/exec-openshift-resources.sh
  fi
done

TEMPLATE_PARAMETERS=()

##############################################
### CUSTOM ROUTES FROM .lagoon.yml
##############################################

# Two while loops as we have multiple services that want routes and each service has multiple routes
ROUTES_SERVICE_COUNTER=0
while [ -n "$(cat .lagoon.yml | shyaml keys environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER 2> /dev/null)" ]; do
  ROUTES_SERVICE=$(cat .lagoon.yml | shyaml keys environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER)

  ROUTE_DOMAIN_COUNTER=0
  while [ -n "$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER 2> /dev/null)" ]; do
    # Routes can either be a key (when the have additional settings) or just a value
    if cat .lagoon.yml | shyaml keys environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER &> /dev/null; then
      ROUTE_DOMAIN=$(cat .lagoon.yml | shyaml keys environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER)
      # Route Domains include dots, which need to be esacped via `\.` in order to use them within shyaml
      ROUTE_DOMAIN_ESCAPED=$(cat .lagoon.yml | shyaml keys environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER | sed 's/\./\\./g')
      ROUTE_TLS_ACME=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.tls-acme true)
      ROUTE_INSECURE=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER.$ROUTE_DOMAIN_ESCAPED.insecure Redirect)
    else
      # Only a value given, assuming some defaults
      ROUTE_DOMAIN=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.routes.$ROUTES_SERVICE_COUNTER.$ROUTES_SERVICE.$ROUTE_DOMAIN_COUNTER)
      ROUTE_TLS_ACME=true
      ROUTE_INSECURE=Redirect
    fi

    # The very first found route is set as MAIN_CUSTOM_ROUTE
    if [ -z "${MAIN_CUSTOM_ROUTE+x}" ]; then
      MAIN_CUSTOM_ROUTE=$ROUTE_DOMAIN
    fi

    ROUTE_SERVICE=$ROUTES_SERVICE

    .  /oc-build-deploy/scripts/exec-openshift-create-route.sh

    let ROUTE_DOMAIN_COUNTER=ROUTE_DOMAIN_COUNTER+1
  done

  let ROUTES_SERVICE_COUNTER=ROUTES_SERVICE_COUNTER+1
done

if [ -f /oc-build-deploy/lagoon/${YAML_CONFIG_FILE}.yml ]; then
  oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f /oc-build-deploy/lagoon/${YAML_CONFIG_FILE}.yml
fi

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
oc process --local --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f /oc-build-deploy/openshift-templates/configmap.yml \
  -p NAME="lagoon-env" \
  -p SAFE_BRANCH="${SAFE_BRANCH}" \
  -p SAFE_PROJECT="${SAFE_PROJECT}" \
  -p BRANCH="${BRANCH}" \
  -p PROJECT="${PROJECT}" \
  -p ENVIRONMENT_TYPE="${ENVIRONMENT_TYPE}" \
  -p ROUTE="${ROUTE}" \
  -p ROUTES="${ROUTES}" \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -

if [ "$TYPE" == "pullrequest" ]; then
  oc patch --insecure-skip-tls-verify \
    -n ${OPENSHIFT_PROJECT} \
    configmap lagoon-env \
    -p "{\"data\":{\"LAGOON_PR_HEAD_BRANCH\":\"${PR_HEAD_BRANCH}\", \"LAGOON_PR_BASE_BRANCH\":\"${PR_BASE_BRANCH}\", \"LAGOON_PR_TITLE\":\"${PR_TITLE}\"}}"
fi

##############################################
### PUSH IMAGES TO OPENSHIFT REGISTRY
##############################################
if [[ $THIS_IS_TUG == "true" ]]; then
  # Allow to disable registry auth
  if [ ! "${TUG_SKIP_REGISTRY_AUTH}" == "true" ]; then
    # This adds the defined credentials to the serviceaccount/default so that the deployments can pull from the remote registry
    if oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get secret tug-registry 2> /dev/null; then
      oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} delete secret tug-registry
    fi

    oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} secrets new-dockercfg tug-registry --docker-server="${TUG_REGISTRY}" --docker-username="${TUG_REGISTRY_USERNAME}" --docker-password="${TUG_REGISTRY_PASSWORD}" --docker-email="${TUG_REGISTRY_USERNAME}"
    oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} secrets add serviceaccount/default secrets/tug-registry --for=pull
  fi

  # Import all remote Images into ImageStreams
  readarray -t TUG_IMAGES < /oc-build-deploy/tug/images
  for TUG_IMAGE in "${TUG_IMAGES[@]}"
  do
    oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} tag --source=docker "${TUG_REGISTRY}/${TUG_REGISTRY_REPOSITORY}/${TUG_IMAGE_PREFIX}${TUG_IMAGE}:${SAFE_BRANCH}" "${TUG_IMAGE}:latest"
  done

elif [ "$TYPE" == "pullrequest" ] || [ "$TYPE" == "branch" ]; then
  for IMAGE_NAME in "${!IMAGES_BUILD[@]}"
  do
    # Before the push the temporary name is resolved to the future tag with the registry in the image name
    TEMPORARY_IMAGE_NAME="${IMAGES_BUILD[${IMAGE_NAME}]}"

    # This will actually not push any images and instead just add them to the file /oc-build-deploy/lagoon/push
    . /oc-build-deploy/scripts/exec-push-parallel.sh
  done

  # If we have Images to Push to the OpenRegistry, let's do so
  if [ -f /oc-build-deploy/lagoon/push ]; then
    parallel --retries 4 < /oc-build-deploy/lagoon/push
  fi

  # All images that should be pulled are tagged as Images directly in OpenShift Registry
  for IMAGE_NAME in "${!IMAGES_PULL[@]}"
  do
    PULL_IMAGE="${IMAGES_PULL[${IMAGE_NAME}]}"
    . /oc-build-deploy/scripts/exec-openshift-tag-dockerhub.sh
  done
elif [ "$TYPE" == "promote" ]; then

  for IMAGE_NAME in "${IMAGES[@]}"
  do
    .  /oc-build-deploy/scripts/exec-openshift-tag.sh
  done

fi

# Load all Image Hashes for just pushed images
declare -A IMAGE_HASHES
parallel --retries 40 --results /tmp/istag oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get istag -o go-template --template='{{.image.dockerImageReference}}' {}:latest ::: ${IMAGES[@]}
for i in $(ls /tmp/istag/1); do
  IMAGE_HASHES[${i}]=$(cat /tmp/istag/1/${i}/stdout)
done

##############################################
### CREATE PVC, DEPLOYMENTS AND CRONJOBS
##############################################

YAML_CONFIG_FILE="deploymentconfigs-pvcs-cronjobs"

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do
  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[1]}
  COMPOSE_SERVICE=${MAP_SERVICE_TYPE_TO_COMPOSE_SERVICE["${SERVICE_TYPES_ENTRY}"]}

  # Some Templates need additonal Parameters, like where persistent storage can be found.
  TEMPLATE_PARAMETERS=()
  PERSISTENT_STORAGE_PATH=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.persistent false)

  if [ ! $PERSISTENT_STORAGE_PATH == "false" ]; then
    TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_PATH="${PERSISTENT_STORAGE_PATH}")

    PERSISTENT_STORAGE_CLASS=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.persistent\\.class false)
    if [ ! $PERSISTENT_STORAGE_CLASS == "false" ]; then
      TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_CLASS="${PERSISTENT_STORAGE_CLASS}")
    fi

    PERSISTENT_STORAGE_NAME=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.persistent\\.name false)
    if [ ! $PERSISTENT_STORAGE_NAME == "false" ]; then
      TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_NAME="${PERSISTENT_STORAGE_NAME}")
    fi
  fi

  PERSISTENT_STORAGE_SIZE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.persistent\\.size false)
  if [ ! $PERSISTENT_STORAGE_SIZE == "false" ]; then
    TEMPLATE_PARAMETERS+=(-p PERSISTENT_STORAGE_SIZE="${PERSISTENT_STORAGE_SIZE}")
  fi

  DEPLOYMENT_STRATEGY=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.deployment\\.strategy false)
  if [ ! $DEPLOYMENT_STRATEGY == "false" ]; then
    TEMPLATE_PARAMETERS+=(-p DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY}")
  fi

  # Generate PVC if service type defines one
  OPENSHIFT_SERVICES_TEMPLATE="/oc-build-deploy/openshift-templates/${SERVICE_TYPE}/pvc.yml"
  if [ -f $OPENSHIFT_SERVICES_TEMPLATE ]; then
    OPENSHIFT_TEMPLATE=$OPENSHIFT_SERVICES_TEMPLATE
    .  /oc-build-deploy/scripts/exec-openshift-create-pvc.sh
  fi

  CRONJOB_COUNTER=0
  CRONJOBS_ARRAY=()
  while [ -n "$(cat .lagoon.yml | shyaml keys environments.${BRANCH//./\\.}.cronjobs.$CRONJOB_COUNTER 2> /dev/null)" ]
  do

    CRONJOB_SERVICE=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.cronjobs.$CRONJOB_COUNTER.service)

    # Only implement the cronjob for the services we are currently handling
    if [ $CRONJOB_SERVICE == $SERVICE_NAME ]; then

      CRONJOB_NAME=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.cronjobs.$CRONJOB_COUNTER.name | sed "s/[^[:alnum:]-]/-/g" | sed "s/^-//g")
      # Add this cronjob to the native cleanup array, this will remove native cronjobs at the end of this script
      NATIVE_CRONJOB_CLEANUP_ARRAY+=("cronjob-${SERVICE_NAME}-${CRONJOB_NAME}")

      CRONJOB_SCHEDULE=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.cronjobs.$CRONJOB_COUNTER.schedule)
      # Convert the Cronjob Schedule for additional features and better spread
      CRONJOB_SCHEDULE=$( /oc-build-deploy/scripts/convert-crontab.sh "$CRONJOB_SCHEDULE")
      CRONJOB_COMMAND=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.cronjobs.$CRONJOB_COUNTER.command)

      CRONJOBS_ARRAY+=("${CRONJOB_SCHEDULE} ${CRONJOB_COMMAND}")

    fi

    let CRONJOB_COUNTER=CRONJOB_COUNTER+1
  done

  # Generate cronjobs if service type defines them
  SERVICE_CRONJOB_FILE="/oc-build-deploy/openshift-templates/${SERVICE_TYPE}/cronjobs.yml"
  if [ -f $SERVICE_CRONJOB_FILE ]; then
    CRONJOB_COUNTER=0
    while [ -n "$(cat ${SERVICE_CRONJOB_FILE} | shyaml keys $CRONJOB_COUNTER 2> /dev/null)" ]
    do

      CRONJOB_NAME=$(cat ${SERVICE_CRONJOB_FILE} | shyaml get-value $CRONJOB_COUNTER.name | sed "s/[^[:alnum:]-]/-/g" | sed "s/^-//g")
      # Add this cronjob to the native cleanup array, this will remove native cronjobs at the end of this script
      NATIVE_CRONJOB_CLEANUP_ARRAY+=("cronjob-${SERVICE_NAME}-${CRONJOB_NAME}")

      CRONJOB_SCHEDULE=$(cat ${SERVICE_CRONJOB_FILE} | shyaml get-value $CRONJOB_COUNTER.schedule)
      # Convert the Cronjob Schedule for additional features and better spread
      CRONJOB_SCHEDULE=$( /oc-build-deploy/scripts/convert-crontab.sh "$CRONJOB_SCHEDULE")
      CRONJOB_COMMAND=$(cat ${SERVICE_CRONJOB_FILE} | shyaml get-value $CRONJOB_COUNTER.command)

      CRONJOBS_ARRAY+=("${CRONJOB_SCHEDULE} ${CRONJOB_COMMAND}")
      let CRONJOB_COUNTER=CRONJOB_COUNTER+1
    done
  fi

  if [[ ${#CRONJOBS_ARRAY[@]} -ge 1 ]]; then
    CRONJOBS_ONELINE=$(printf "%s\\n" "${CRONJOBS_ARRAY[@]}")
    TEMPLATE_PARAMETERS+=(-p CRONJOBS="${CRONJOBS_ONELINE}")
  fi

  OVERRIDE_TEMPLATE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.$COMPOSE_SERVICE.labels.lagoon\\.template false)
  if [ "${OVERRIDE_TEMPLATE}" == "false" ]; then
    OPENSHIFT_TEMPLATE="/oc-build-deploy/openshift-templates/${SERVICE_TYPE}/deployment.yml"
    if [ -f $OPENSHIFT_TEMPLATE ]; then
      . /oc-build-deploy/scripts/exec-openshift-resources-with-images.sh
    fi
  else
    OPENSHIFT_TEMPLATE=$OVERRIDE_TEMPLATE
    if [ ! -f $OPENSHIFT_TEMPLATE ]; then
      echo "defined template $OPENSHIFT_TEMPLATE for service $SERVICE_TYPE not found"; exit 1;
    else
      . /oc-build-deploy/scripts/exec-openshift-resources-with-images.sh
    fi
  fi

  # Generate statefulset if service type defines them
  OPENSHIFT_STATEFULSET_TEMPLATE="/oc-build-deploy/openshift-templates/${SERVICE_TYPE}/statefulset.yml"
  if [ -f $OPENSHIFT_STATEFULSET_TEMPLATE ]; then
    OPENSHIFT_TEMPLATE=$OPENSHIFT_STATEFULSET_TEMPLATE
    . /oc-build-deploy/scripts/exec-openshift-resources-with-images.sh
  fi
done

##############################################
### APPLY RESOURCES
##############################################

if [ -f /oc-build-deploy/lagoon/${YAML_CONFIG_FILE}.yml ]; then
  oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f /oc-build-deploy/lagoon/${YAML_CONFIG_FILE}.yml
fi

##############################################
### WAIT FOR POST-ROLLOUT TO BE FINISHED
##############################################

for SERVICE_TYPES_ENTRY in "${SERVICE_TYPES[@]}"
do

  IFS=':' read -ra SERVICE_TYPES_ENTRY_SPLIT <<< "$SERVICE_TYPES_ENTRY"

  SERVICE_NAME=${SERVICE_TYPES_ENTRY_SPLIT[0]}
  SERVICE_TYPE=${SERVICE_TYPES_ENTRY_SPLIT[1]}

  SERVICE_ROLLOUT_TYPE=$(cat $DOCKER_COMPOSE_YAML | shyaml get-value services.${SERVICE_NAME}.labels.lagoon\\.rollout deploymentconfigs)

  # if mariadb-galera is a statefulset check also for maxscale
  if [ $SERVICE_TYPE == "mariadb-galera" ]; then

    STATEFULSET="${SERVICE_NAME}-galera"
    . /oc-build-deploy/scripts/exec-monitor-statefulset.sh

    SERVICE_NAME="${SERVICE_NAME}-maxscale"
    . /oc-build-deploy/scripts/exec-monitor-deploy.sh

  elif [ $SERVICE_TYPE == "elasticsearch-cluster" ]; then

    STATEFULSET="${SERVICE_NAME}"
    . /oc-build-deploy/scripts/exec-monitor-statefulset.sh

  elif [ ! $SERVICE_ROLLOUT_TYPE == "false" ]; then
    . /oc-build-deploy/scripts/exec-monitor-deploy.sh
  fi
done

##############################################
### CLEANUP NATIVE CRONJOBS NOW RUNNING WITHIN CONTAINERS DIRECTLY
##############################################

for CRONJOB in "${NATIVE_CRONJOB_CLEANUP_ARRAY[@]}"
do
  if oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} get cronjob ${CRONJOB}; then
    oc --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} delete cronjob ${CRONJOB}
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
        CONTAINER=$(cat .lagoon.yml | shyaml get-value tasks.post-rollout.$COUNTER.$TASK_TYPE.container false)
        SHELL=$(cat .lagoon.yml | shyaml get-value tasks.post-rollout.$COUNTER.$TASK_TYPE.shell sh)
        . /oc-build-deploy/scripts/exec-post-rollout-tasks-run.sh
        ;;
    *)
        echo "Task Type ${TASK_TYPE} not implemented"; exit 1;

  esac

  let COUNTER=COUNTER+1
done
