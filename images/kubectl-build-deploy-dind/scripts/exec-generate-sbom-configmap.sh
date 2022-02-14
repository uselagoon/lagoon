#!/bin/bash

# SBOM config
TMP_DIR="${TMP_DIR:-/tmp}"
SBOM_OUTPUT="cyclonedx-json"
SBOM_OUTPUT_FILE="${TMP_DIR}/${IMAGE_NAME}.cyclonedx.json.gz"

set -x
# Run sbom and dump to file
echo "Running sbom scan using syft"
echo "Image being scanned: ${IMAGE_FULL}"
set +x

DOCKER_HOST=docker-host.lagoon.svc docker run --rm -v /var/run/docker.sock:/var/run/docker.sock imagecache.amazeeio.cloud/anchore/syft packages ${IMAGE_FULL} -o ${SBOM_OUTPUT} | gzip > ${SBOM_OUTPUT_FILE}

if [ -f "${SBOM_OUTPUT_FILE}" ]; then
    echo "Successfully generated SBOM for ${IMAGE_FULL}"

    SBOM_CONFIGMAP=lagoon-sbom-${IMAGE_NAME}

    set -x
    # If sbom configmap already exists then we need to update, else create new
    if kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get configmap $SBOM_CONFIGMAP &> /dev/null; then
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            create configmap $SBOM_CONFIGMAP \
            --from-file=${SBOM_OUTPUT_FILE} \
            -o json \
            --dry-run=client | kubectl replace -f -
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            label configmap ${SBOM_CONFIGMAP} \
            lagoon.sh/insightsType=sbom \
            lagoon.sh/buildName=${LAGOON_BUILD_NAME} \
            lagoon.sh/project=${PROJECT} \
            lagoon.sh/environment=${ENVIRONMENT} \
            lagoon.sh/service=${IMAGE_NAME}

    else
        # Create configmap and add label (#have to add label separately: https://github.com/kubernetes/kubernetes/issues/60295)
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            create configmap ${SBOM_CONFIGMAP} \
            --from-file=${SBOM_OUTPUT_FILE}
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            label configmap ${SBOM_CONFIGMAP} \
            lagoon.sh/insightsType=sbom \
            lagoon.sh/buildName=${LAGOON_BUILD_NAME} \
            lagoon.sh/project=${PROJECT} \
            lagoon.sh/environment=${ENVIRONMENT} \
            lagoon.sh/service=${IMAGE_NAME}
    fi
    set +x
else
    echo "Failed to generate SBOM for ${IMAGE_FULL}"
fi
