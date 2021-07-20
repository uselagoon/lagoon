#!/bin/bash
set -x
set -eo pipefail
set -o noglob

REGISTRY=$REGISTRY
NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
REGISTRY_REPOSITORY=$NAMESPACE
LAGOON_VERSION=$(cat /lagoon/version)

if [ ! -z "$LAGOON_PROJECT_VARIABLES" ]; then
  INTERNAL_REGISTRY_URL=$(jq --argjson data "$LAGOON_PROJECT_VARIABLES" -n -r '$data | .[] | select(.scope == "internal_container_registry") | select(.name == "INTERNAL_REGISTRY_URL") | .value' | sed -e 's#^http://##' | sed -e 's#^https://##')
  INTERNAL_REGISTRY_USERNAME=$(jq --argjson data "$LAGOON_PROJECT_VARIABLES" -n -r '$data | .[] | select(.scope == "internal_container_registry") | select(.name == "INTERNAL_REGISTRY_USERNAME") | .value')
  INTERNAL_REGISTRY_PASSWORD=$(jq --argjson data "$LAGOON_PROJECT_VARIABLES" -n -r '$data | .[] | select(.scope == "internal_container_registry") | select(.name == "INTERNAL_REGISTRY_PASSWORD") | .value')
fi

if [ "$CI" == "true" ]; then
  CI_OVERRIDE_IMAGE_REPO=172.17.0.1:5000/lagoon
else
  CI_OVERRIDE_IMAGE_REPO=""
fi

if [ "$BUILD_TYPE" == "pullrequest" ]; then
  /kubectl-build-deploy/scripts/git-checkout-pull-merge.sh "$SOURCE_REPOSITORY" "$PR_HEAD_SHA" "$PR_BASE_SHA"
else
  /kubectl-build-deploy/scripts/git-checkout-pull.sh "$SOURCE_REPOSITORY" "$GIT_REF"
fi

if [[ -n "$SUBFOLDER" ]]; then
  cd $SUBFOLDER
fi

if [ ! -f .lagoon.yml ]; then
  echo "no .lagoon.yml file found"; exit 1;
fi

INJECT_GIT_SHA=$(cat .lagoon.yml | shyaml get-value environment_variables.git_sha false)
if [ "$INJECT_GIT_SHA" == "true" ]
then
  LAGOON_GIT_SHA=`git rev-parse HEAD`
else
  LAGOON_GIT_SHA="0000000000000000000000000000000000000000"
fi

REGISTRY_SECRETS=()
PRIVATE_REGISTRY_COUNTER=0
PRIVATE_REGISTRY_URLS=()
PRIVATE_DOCKER_HUB_REGISTRY=0
PRIVATE_EXTERNAL_REGISTRY=0

set +x

DEPLOYER_TOKEN=$(cat /var/run/secrets/lagoon/deployer/token)

kubectl config set-credentials lagoon/kubernetes.default.svc --token="${DEPLOYER_TOKEN}"
kubectl config set-cluster kubernetes.default.svc --insecure-skip-tls-verify=true --server=https://kubernetes.default.svc
kubectl config set-context default/lagoon/kubernetes.default.svc --user=lagoon/kubernetes.default.svc --namespace="${NAMESPACE}" --cluster=kubernetes.default.svc
kubectl config use-context default/lagoon/kubernetes.default.svc

if [ ! -z ${INTERNAL_REGISTRY_URL} ] && [ ! -z ${INTERNAL_REGISTRY_USERNAME} ] && [ ! -z ${INTERNAL_REGISTRY_PASSWORD} ] ; then
  echo "docker login -u '${INTERNAL_REGISTRY_USERNAME}' -p '${INTERNAL_REGISTRY_PASSWORD}' ${INTERNAL_REGISTRY_URL}" | /bin/bash
  # create lagoon-internal-registry-secret if it does not exist yet
  if ! kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get secret lagoon-internal-registry-secret &> /dev/null; then
    kubectl create secret docker-registry lagoon-internal-registry-secret --docker-server=${INTERNAL_REGISTRY_URL} --docker-username=${INTERNAL_REGISTRY_USERNAME} --docker-password=${INTERNAL_REGISTRY_PASSWORD} --dry-run -o yaml | kubectl apply -f -
  fi
  REGISTRY_SECRETS+=("lagoon-internal-registry-secret")
  REGISTRY=$INTERNAL_REGISTRY_URL # This will handle pointing Lagoon at the correct registry for non local builds
fi

##############################################
### PRIVATE REGISTRY LOGINS
##############################################
# we want to be able to support private container registries
# grab all the container-registries that are defined in the `.lagoon.yml` file
PRIVATE_CONTAINER_REGISTRIES=($(cat .lagoon.yml | shyaml keys container-registries || echo ""))
for PRIVATE_CONTAINER_REGISTRY in "${PRIVATE_CONTAINER_REGISTRIES[@]}"
do
  # check if a url is set, if none set proceed against docker hub
  PRIVATE_CONTAINER_REGISTRY_URL=$(cat .lagoon.yml | shyaml get-value container-registries.$PRIVATE_CONTAINER_REGISTRY.url false)
  if [ $PRIVATE_CONTAINER_REGISTRY_URL == "false" ]; then
    echo "No 'url' defined for registry $PRIVATE_CONTAINER_REGISTRY, will proceed against docker hub";
  fi
  # check the username and passwords are defined in yaml
  PRIVATE_CONTAINER_REGISTRY_USERNAME=$(cat .lagoon.yml | shyaml get-value container-registries.$PRIVATE_CONTAINER_REGISTRY.username false)
  if [ $PRIVATE_CONTAINER_REGISTRY_USERNAME == "false" ]; then
    echo "No 'username' defined for registry $PRIVATE_CONTAINER_REGISTRY"; exit 1;
  fi
  PRIVATE_CONTAINER_REGISTRY_PASSWORD=$(cat .lagoon.yml | shyaml get-value container-registries.$PRIVATE_CONTAINER_REGISTRY.password false)
  if [[ $PRIVATE_CONTAINER_REGISTRY_PASSWORD == "false" ]]; then
    echo "No 'password' defined for registry $PRIVATE_CONTAINER_REGISTRY"; exit 1;
  fi
  # if we have everything we need, we can proceed to logging in
  if [ $PRIVATE_CONTAINER_REGISTRY_PASSWORD != "false" ]; then
    PRIVATE_REGISTRY_CREDENTIAL=""
    # check if we have a password defined anywhere in the api first
    if [ ! -z "$LAGOON_PROJECT_VARIABLES" ]; then
      PRIVATE_REGISTRY_CREDENTIAL=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.scope == "container_registry" and .name == "'$PRIVATE_CONTAINER_REGISTRY_PASSWORD'") | "\(.value)"'))
    fi
    if [ ! -z "$LAGOON_ENVIRONMENT_VARIABLES" ]; then
      TEMP_PRIVATE_REGISTRY_CREDENTIAL=($(echo $LAGOON_ENVIRONMENT_VARIABLES | jq -r '.[] | select(.scope == "container_registry" and .name == "'$PRIVATE_CONTAINER_REGISTRY_PASSWORD'") | "\(.value)"'))
      if [ ! -z "$TEMP_PRIVATE_REGISTRY_CREDENTIAL" ]; then
        PRIVATE_REGISTRY_CREDENTIAL=$TEMP_PRIVATE_REGISTRY_CREDENTIAL
      fi
    fi
    if [ -z $PRIVATE_REGISTRY_CREDENTIAL ]; then
      #if no password defined in the lagoon api, pass the one in `.lagoon.yml` as a password
      PRIVATE_REGISTRY_CREDENTIAL=$PRIVATE_CONTAINER_REGISTRY_PASSWORD
    fi
    if [ -z "$PRIVATE_REGISTRY_CREDENTIAL" ]; then
      echo -e "A private container registry was defined in the .lagoon.yml file, but no password could be found in either the .lagoon.yml or in the Lagoon API\n\nPlease check if the password has been set correctly."
      exit 1
    fi
    if [ $PRIVATE_CONTAINER_REGISTRY_URL != "false" ]; then
      echo "Attempting to log in to $PRIVATE_CONTAINER_REGISTRY_URL with user $PRIVATE_CONTAINER_REGISTRY_USERNAME - $PRIVATE_CONTAINER_REGISTRY_PASSWORD"
      docker login --username $PRIVATE_CONTAINER_REGISTRY_USERNAME --password $PRIVATE_REGISTRY_CREDENTIAL $PRIVATE_CONTAINER_REGISTRY_URL
      kubectl create secret docker-registry "lagoon-private-registry-${PRIVATE_REGISTRY_COUNTER}-secret" --docker-server=$PRIVATE_CONTAINER_REGISTRY_URL --docker-username=$PRIVATE_CONTAINER_REGISTRY_USERNAME --docker-password=$PRIVATE_REGISTRY_CREDENTIAL --dry-run -o yaml | kubectl apply -f -
      REGISTRY_SECRETS+=("lagoon-private-registry-${PRIVATE_REGISTRY_COUNTER}-secret")
      PRIVATE_REGISTRY_URLS+=($PRIVATE_CONTAINER_REGISTRY_URL)
      PRIVATE_EXTERNAL_REGISTRY=1
      let ++PRIVATE_REGISTRY_COUNTER
    else
      echo "Attempting to log in to docker hub with user $PRIVATE_CONTAINER_REGISTRY_USERNAME - $PRIVATE_CONTAINER_REGISTRY_PASSWORD"
      docker login --username $PRIVATE_CONTAINER_REGISTRY_USERNAME --password $PRIVATE_REGISTRY_CREDENTIAL
      kubectl create secret docker-registry "lagoon-private-registry-${PRIVATE_REGISTRY_COUNTER}-secret" --docker-server="https://index.docker.io/v1/" --docker-username=$PRIVATE_CONTAINER_REGISTRY_USERNAME --docker-password=$PRIVATE_REGISTRY_CREDENTIAL --dry-run -o yaml | kubectl apply -f -
      REGISTRY_SECRETS+=("lagoon-private-registry-${PRIVATE_REGISTRY_COUNTER}-secret")
      PRIVATE_REGISTRY_URLS+=("")
      PRIVATE_DOCKER_HUB_REGISTRY=1
      let ++PRIVATE_REGISTRY_COUNTER
    fi
  fi
done

set -x

.  /kubectl-build-deploy/build-deploy-docker-compose.sh
