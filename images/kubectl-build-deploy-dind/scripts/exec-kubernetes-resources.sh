#!/bin/bash

cat /kubectl-build-deploy/values.yaml

helm template ${SERVICE_NAME} /kubectl-build-deploy/helmcharts/${SERVICE_TYPE} -s ${HELM_TEMPLATE} -f /kubectl-build-deploy/values.yaml "${HELM_ARGUMENTS[@]}" > $YAML_FOLDER/${SERVICE_NAME}.yaml
