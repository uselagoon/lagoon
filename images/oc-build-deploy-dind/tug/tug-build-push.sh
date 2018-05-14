TUG_REGISTRY=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.tug.registry false)
TUG_REGISTRY_USERNAME=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.tug.username false)
TUG_REGISTRY_PASSWORD=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.tug.password false)
TUG_REGISTRY_REPOSITORY=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.tug.repository false)
TUG_IMAGE_PREFIX=$(cat .lagoon.yml | shyaml get-value environments.${BRANCH//./\\.}.tug.image-prefix '')


# Login into TUG registry
docker login -u="${TUG_REGISTRY_USERNAME}" -p="${TUG_REGISTRY_PASSWORD}" ${TUG_REGISTRY}
# Overwrite the registry with the tug registry, so Images are pushed to there
OPENSHIFT_REGISTRY=$TUG_REGISTRY
REGISTRY_REPOSITORY=$TUG_REGISTRY_REPOSITORY

for IMAGE_NAME in "${IMAGES[@]}"
do
  # Before the push the temporary name is resolved to the future tag with the registry in the image name
  TEMPORARY_IMAGE_NAME="${OPENSHIFT_PROJECT}-${IMAGE_NAME}"
  ORIGINAL_IMAGE_NAME="${IMAGE_NAME}"
  IMAGE_NAME="${TUG_IMAGE_PREFIX}${IMAGE_NAME}"
  IMAGE_TAG="${SAFE_BRANCH}"
  .  /oc-build-deploy/scripts/exec-push-parallel.sh
  echo "${ORIGINAL_IMAGE_NAME}" >> /oc-build-deploy/tug/images
done

# Save the current environment variables so the tug deployment dan us them
echo "TYPE=\"${TYPE}\"" >> /oc-build-deploy/tug/env
echo "SAFE_BRANCH=\"${SAFE_BRANCH}\"" >> /oc-build-deploy/tug/env
echo "BRANCH=\"${BRANCH}\"" >> /oc-build-deploy/tug/env
echo "SAFE_PROJECT=\"${SAFE_PROJECT}\"" >> /oc-build-deploy/tug/env
echo "PROJECT=\"${PROJECT}\"" >> /oc-build-deploy/tug/env
echo "ROUTER_URL=\"${ROUTER_URL}\"" >> /oc-build-deploy/tug/env
echo "ENVIRONMENT_TYPE=\"${ENVIRONMENT_TYPE}\"" >> /oc-build-deploy/tug/env
echo "CI_USE_OPENSHIFT_REGISTRY=\"${CI_USE_OPENSHIFT_REGISTRY}\"" >> /oc-build-deploy/tug/env
echo "LAGOON_GIT_SHA=\"${LAGOON_GIT_SHA}\"" >> /oc-build-deploy/tug/env
echo "TUG_REGISTRY=\"${TUG_REGISTRY}\"" >> /oc-build-deploy/tug/env
echo "TUG_REGISTRY_USERNAME=\"${TUG_REGISTRY_USERNAME}\"" >> /oc-build-deploy/tug/env
echo "TUG_REGISTRY_PASSWORD=\"${TUG_REGISTRY_PASSWORD}\"" >> /oc-build-deploy/tug/env
echo "TUG_REGISTRY_REPOSITORY=\"${TUG_REGISTRY_REPOSITORY}\"" >> /oc-build-deploy/tug/env
echo "TUG_IMAGE_PREFIX=\"${TUG_IMAGE_PREFIX}\"" >> /oc-build-deploy/tug/env

# build the tug docker image
IMAGE_NAME="${TUG_IMAGE_PREFIX}lagoon-tug"
BUILD_CONTEXT="/oc-build-deploy/"
DOCKERFILE="tug/Dockerfile"
BUILD_ARGS=()
BUILD_ARGS+=(--build-arg IMAGE_REPO="${CI_OVERRIDE_IMAGE_REPO}")
TEMPORARY_IMAGE_NAME="${OPENSHIFT_PROJECT}-${IMAGE_NAME}"
.  /oc-build-deploy/scripts/exec-build.sh
IMAGE_TAG="${SAFE_BRANCH}"
.  /oc-build-deploy/scripts/exec-push-parallel.sh
