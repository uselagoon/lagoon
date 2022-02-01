#!/bin/bash

# SBOM config
TMP_DIR="${TMP_DIR:-/tmp}"
SBOM_OUTPUT="cyclonedx-json"

#echo "Installing syft"
# Install jq
#JQ=/usr/bin/jq
#curl -LSs https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 -o $JQ && chmod 755 $JQ

# Install syft / grype
#curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin > /dev/null 2>&1
#curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin > /dev/null 2>&1

set -x
# Run sbom and dump to file
echo "Running sbom scan using syft"
echo "Image being scanned: ${IMAGE_FULL}"
set +x

DOCKER_HOST=unix:///var/run/docker.sock SYFT_REGISTRY_INSECURE_USE_HTTP=true syft -vvv packages ${IMAGE_FULL} -o ${SBOM_OUTPUT}


if SBOM_IMAGE_RESULTS=$(syft -q packages ${IMAGE_FULL} -o ${SBOM_OUTPUT} > ${TMP_DIR}/${REPO}-${IMAGE_NAME}.cyclonedx.json); then
    echo "Successfully generated SBOM for ${IMAGE_FULL}"

    SBOM_CONFIGMAP=${REPO}-${IMAGE_NAME}-sbom.config

    set -x
    # If sbom configmap already exists then we need to update, else create new
    if kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get configmap $SBOM_CONFIGMAP &> /dev/null; then
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            create configmap $SBOM_CONFIGMAP \
            --from-file=${TMP_DIR}/${REPO}-${IMAGE_NAME}.cyclonedx.json \
            -o json \
            --dry-run=client | kubectl replace -f -
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            label configmap ${REPO}-${IMAGE_NAME}-sbom.config \
            lagoon.sh=insights-sbom
    else
        # Create configmap and add label (#have to add label separately: https://github.com/kubernetes/kubernetes/issues/60295)
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            create configmap ${REPO}-${IMAGE_NAME}-sbom.config \
            --from-file=${TMP_DIR}/${REPO}-${IMAGE_NAME}.cyclonedx.json
        kubectl --insecure-skip-tls-verify \
            -n ${NAMESPACE} \
            label configmap ${REPO}-${IMAGE_NAME}-sbom.config \
            lagoon.sh=insights-sbom
    fi
    set +x
else
    echo "Failed to generate SBOM for ${IMAGE_FULL}"
fi