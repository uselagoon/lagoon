#!/bin/bash -xe

set -o pipefail

/scripts/git-checkout-pull.sh $GIT_REPO $GIT_REF

AMAZEEIO_GIT_SHA=`git rev-parse HEAD`

pushd $OPENSHIFT_FOLDER

if [ ! -f .amazeeio.yml ]; then
  echo "no .amazeeio.yml file found"; exit 1;
fi

if [ "$OPENSHIFT_CONSOLE" == https://console.appuio.ch ] ; then
  CREATED=`date +%s`000
  APPUIO_ID="appuio public"

  # check first if the project exists, if not try to create it
  curl -s -f -H "X-AccessToken: ${APPUIO_TOKEN}" "https://control.vshn.net/api/openshift/1/${APPUIO_ID}/projects/${OPENSHIFT_PROJECT}" || \
  cat /appuio/appuio.json | sed "s/CREATED/$CREATED/" | sed "s/PROJECTID/$OPENSHIFT_PROJECT/" | sed "s/PROJECTDESCRIPTION/[${SITEGROUP//\//\\/}] ${BRANCH//\//\\/}/"  | \
    curl -s -d @- -X POST -H "X-AccessToken: ${APPUIO_TOKEN}" "https://control.vshn.net/api/openshift/1/${APPUIO_ID}/projects/"
else
  oc project  --insecure-skip-tls-verify $OPENSHIFT_PROJECT || oc new-project  --insecure-skip-tls-verify $OPENSHIFT_PROJECT --display-name="[${SITEGROUP}] ${BRANCH}"
fi

# If we have a project user set, give that user access to the created project
if [ ! -z "$OPENSHIFT_PROJECT_USER" ]; then
  oc policy add-role-to-user edit $OPENSHIFT_PROJECT_USER -n $OPENSHIFT_PROJECT
fi

docker login -u=jenkins -p="${OPENSHIFT_TOKEN}" ${OPENSHIFT_REGISTRY}

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
  SERVICE_TYPE=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.amazeeio.type custom)
  DOCKERFILE=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.build.dockerfile false)
  BUILD_CONTEXT=$(cat .amazeeio.yml | shyaml get-value services.$SERVICE_NAME.build.context .)

  if [ $DOCKERFILE == "false" ]; then
    echo "No Dockerfile for service type ${SERVICE_TYPE} defined"; exit 1;
  else
    if [ ! -f $BUILD_CONTEXT/$DOCKERFILE ]; then
      echo "defined Dockerfile $DOCKERFILE for service $SERVICE_NAME not found"; exit 1;
    fi
  fi

  IMAGE_TEMPORARY_NAME=${IMAGE}-${SERVICE_NAME}

  . /scripts/exec-build.sh

  # adding the build image to the list of arguments passed into the next image builds
  BUILD_ARGS+=("${SERVICE_UPPERCASE}_IMAGE=${IMAGE_TEMPORARY_NAME}")
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
  IMAGE_NAME=$SERVICE_NAME
  IMAGE_TEMPORARY_NAME=${IMAGE}-${IMAGE_NAME}
  . /scripts/exec-push.sh
done

for SERVICE_NAME in "${SERVICES[@]}"
do
  . /scripts/exec-monitor-deploy.sh
done
