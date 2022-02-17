#!/bin/bash

TMP_DIR="${TMP_DIR:-/tmp}"
SBOM_OUTPUT="cyclonedx-json"
SBOM_OUTPUT_FILE="${TMP_DIR}/${IMAGE_NAME}.cyclonedx.json.gz"
SBOM_CONFIGMAP="lagoon-insights-sbom-${IMAGE_NAME}"

DOCKER_INSPECT_CONFIGMAP="lagoon-insights-docker-inpsect-${IMAGE_NAME}"
DOCKER_INSPECT_OUTPUT_FILE="${TMP_DIR}/${IMAGE_NAME}.docker-inspect.json.gz"

set -x
# Run docker inspect scan on image
echo "Running docker inspect on: ${IMAGE_FULL}"
set +x

DOCKER_HOST=docker-host.lagoon.svc docker run --rm -v /var/run/docker.sock:/var/run/docker.sock docker inspect ${IMAGE_FULL} | gzip > ${DOCKER_INSPECT_OUTPUT_FILE}

processDockerInspect() {
  echo "Successfully generated image inspection data for ${IMAGE_FULL}"

  set -x
  # If docker-inspect configmap already exists then we need to update, else create new
  if kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get configmap $DOCKER_INSPECT_CONFIGMAP &> /dev/null; then
      kubectl --insecure-skip-tls-verify \
          -n ${NAMESPACE} \
          create configmap $DOCKER_INSPECT_CONFIGMAP \
          --from-file=${DOCKER_INSPECT_OUTPUT_FILE} \
          -o json \
          --dry-run=client | kubectl replace -f -
  else
      kubectl --insecure-skip-tls-verify \
          -n ${NAMESPACE} \
          create configmap ${DOCKER_INSPECT_CONFIGMAP} \
          --from-file=${DOCKER_INSPECT_OUTPUT_FILE}
  fi
  kubectl --insecure-skip-tls-verify \
      -n ${NAMESPACE} \
      label configmap ${DOCKER_INSPECT_CONFIGMAP} \
      lagoon.sh/insightsProcessed- \
      lagoon.sh/insightsType=docker-inspect-gz \
      lagoon.sh/buildName=${LAGOON_BUILD_NAME} \
      lagoon.sh/project=${PROJECT} \
      lagoon.sh/environment=${ENVIRONMENT} \
      lagoon.sh/service=${IMAGE_NAME}
  set +x
}

processDockerInspect

set -x
# Run sbom and dump to file
echo "Running sbom scan using syft"
echo "Image being scanned: ${IMAGE_FULL}"
set +x

DOCKER_HOST=docker-host.lagoon.svc docker run --rm -v /var/run/docker.sock:/var/run/docker.sock imagecache.amazeeio.cloud/anchore/syft packages ${IMAGE_FULL} -o ${SBOM_OUTPUT} | gzip > ${SBOM_OUTPUT_FILE}

FILESIZE=$(stat -c%s "$SBOM_OUTPUT_FILE")
echo "Size of ${SBOM_OUTPUT_FILE} = $FILESIZE bytes."

processSbom() {
  if (( $FILESIZE > 950000 )); then
    echo "$SBOM_OUTPUT_FILE is too large, skipping pushing to configmap"
    return
  else
    echo "Successfully generated SBOM for ${IMAGE_FULL}"

    set -x
    # If sbom configmap already exists then we need to update, else create new
    if kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get configmap $SBOM_CONFIGMAP &> /dev/null; then
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            create configmap $SBOM_CONFIGMAP \
            --from-file=${SBOM_OUTPUT_FILE} \
            -o json \
            --dry-run=client | kubectl replace -f -
    else
        # Create configmap and add label (#have to add label separately: https://github.com/kubernetes/kubernetes/issues/60295)
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            create configmap ${SBOM_CONFIGMAP} \
            --from-file=${SBOM_OUTPUT_FILE}
    fi
    kubectl --insecure-skip-tls-verify \
        -n ${NAMESPACE} \
        label configmap ${SBOM_CONFIGMAP} \
        lagoon.sh/insightsProcessed- \
        lagoon.sh/insightsType=sbom-gz \
        lagoon.sh/buildName=${LAGOON_BUILD_NAME} \
        lagoon.sh/project=${PROJECT} \
        lagoon.sh/environment=${ENVIRONMENT} \
        lagoon.sh/service=${IMAGE_NAME}
    set +x
  fi
}

processSbom
