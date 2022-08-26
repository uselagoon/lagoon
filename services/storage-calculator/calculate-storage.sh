#!/bin/bash

# Send a GraphQL query to Lagoon API.
#
# Accepts query as first param. Usage:
# ALL_ENVIRONMENTS=$(apiQuery "query {
#   allProjects {
#     name
#   }
# }")
apiQuery() {
  local API_TOKEN=$(./create_jwt.py)
  local AUTH_HEADER="Authorization: bearer $API_TOKEN"

  # Convert GraphQL file into single line (but with still \n existing)
  # turn `\n` into `\\n` and escape the quotes.
  local query=$(echo $1 | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
  local result=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$AUTH_HEADER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$query\"}")
  echo "$result"
}

# Load all projects and their environments
ALL_ENVIRONMENTS=$(apiQuery 'query {
  environments:allProjects {
    name
    storageCalc
    environments {
      kubernetesNamespaceName
      name
      id
      kubernetes {
        consoleUrl
        token
        name
      }
    }
  }
}')

echo "$ALL_ENVIRONMENTS" | jq -c '.data.environments[] | select((.environments | length) >= 1)' | while read PROJECT ; do
  PROJECT_NAME=$(echo "$PROJECT" | jq -r '.name')

  # Guard statement, to ensure the project regex is respected.
  if ! [[ $PROJECT_NAME =~ $PROJECT_REGEX ]] ; then
    echo "Project: $PROJECT_NAME [skip, does not match regex: ${PROJECT_REGEX}]"
    continue
  fi

  STORAGE_CALC=$(echo "$PROJECT" | jq -r '.storageCalc')
  echo "Project: $PROJECT_NAME [storage calc: ${STORAGE_CALC}]"

  # Loop through the environments.
  echo "$PROJECT" | jq -c '.environments[]' | while read environment ; do
    CONSOLE_URL=$(echo "$environment" | jq -r '.kubernetes.consoleUrl')
    CONSOLE_TOKEN=$(echo "$environment" | jq -r '.kubernetes.token // empty')
    ENVIRONMENT_NAMESPACE=$(echo "$environment" | jq -r '.kubernetesNamespaceName')
    ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
    ENVIRONMENT_ID=$(echo "$environment" | jq -r '.id')

    echo " > $CONSOLE_URL - $PROJECT_NAME: environment $ENVIRONMENT_NAME"

    if [[ $STORAGE_CALC != "1" ]] ; then
      echo " > $CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: storage calculation disabled, skipping"
      apiQuery "mutation {
        addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"storage-calc-disabled\", bytesUsed:0}) {
          id
        }
      }"
      continue
    fi

    KUBECTL="kubectl --insecure-skip-tls-verify --token=$CONSOLE_TOKEN --server=$CONSOLE_URL -n $ENVIRONMENT_NAMESPACE"

    # Skip if namespace doesn't exist.
    NAMESPACE=$(${KUBECTL} get namespace ${ENVIRONMENT_NAMESPACE} --ignore-not-found=true);
    if ! [[ "$NAMESPACE" ]] ; then
      echo " > $CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no valid namespace found"
      continue
    fi
    # Skip if configamp doesn't exist.
    NAMESPACE=$(${KUBECTL} get configmap lagoon-env --ignore-not-found=true);
    if ! [[ "$NAMESPACE" ]] ; then
      echo " > $CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no lagoon-env configmap found"
      continue
    fi

    # Cleanup any existing storage-calc deployments.
    echo "$CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: delete any existing storage-calc deployments"
    ${KUBECTL} delete deployment/storage-calc --ignore-not-found=true

    echo "$CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: creating storage-calc pod"
    # Start storage-calc deployment.
    TMPFILE=`mktemp -q /tmp/${ENVIRONMENT_NAMESPACE}.XXXXXX`
    ${KUBECTL} create --dry-run=client -o yaml deployment storage-calc --image imagecache.amazeeio.cloud/amazeeio/alpine-mysql-client > $TMPFILE
    yq -i e '.spec.template.spec.containers[0].command = ["sh", "-c", "while sleep 3600; do :; done"]' $TMPFILE
    # Loop through all PVCs, deployment attempt to attach them, so long as they are not in the ignore list.
    PVCS=($(${KUBECTL} get pvc -o name | sed 's/persistentvolumeclaim\///'))
    pvccount=0
    for PVC in "${PVCS[@]}" ; do
      if [ ! -z "$LAGOON_STORAGE_IGNORE_REGEX" ] ; then
        if [[ $PVC =~ $LAGOON_STORAGE_IGNORE_REGEX ]]; then
          echo "> PVC: ${PVC} [skip mounting, it matches the skip regex: ${LAGOON_STORAGE_IGNORE_REGEX}]"
          continue
        fi
      fi

      echo "> PVC: ${PVC} [mounting ${PVC} into storage-calc]"
      yq -i e '.spec.template.spec.containers[0].volumeMounts['$pvccount'].name = "'${PVC}'"' $TMPFILE
      yq -i e '.spec.template.spec.containers[0].volumeMounts['$pvccount'].mountPath = "/storage/'${PVC}'"' $TMPFILE
      yq -i e '.spec.template.spec.volumes['$pvccount'].name = "'${PVC}'"' $TMPFILE
      yq -i e '.spec.template.spec.volumes['$pvccount'].persistentVolumeClaim.claimName = "'${PVC}'"' $TMPFILE
      yq -i e '.spec.template.spec.volumes['$pvccount'].persistentVolumeClaim.readOnly = true' $TMPFILE
      yq -i e '.spec.progressDeadlineSeconds = '${PROGRESS_DEADLINE:-90}'' $TMPFILE
      pvccount=$((pvccount+1))
    done
    # Copy environment variable from lagoon-env configmap.
    yq -i e '.spec.template.spec.containers[0].envFrom[0].configMapRef.name = "lagoon-env"' $TMPFILE
    ${KUBECTL} create -f $TMPFILE

    echo "$CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: rewaiting for storage-calc pod to start"
    ${KUBECTL} rollout status deployment/storage-calc --watch --request-timeout=30s

    POD=$(${KUBECTL} get pods -l app=storage-calc -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')

    if [[ ! $POD ]] ; then
      echo "No running pod found for storage-calc"
      ${KUBECTL} delete deployment/storage-calc --ignore-not-found=true
      continue
    fi

    echo "$CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: loading storage information"

    if [[ ! ${#PVCS[@]} -gt 0 ]] ; then
      echo "$CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no PVCs found writing API with 0 bytes"
      apiQuery "mutation {
        addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"none\", bytesUsed:0}) {
          id
        }
      }"

    else
      # Loop through all PVCs, and calculate their usage, so long as they are not in the ignore list.
      for PVC in "${PVCS[@]}" ; do
        if [ ! -z "$LAGOON_STORAGE_IGNORE_REGEX" ] ; then
          if [[ $PVC =~ $LAGOON_STORAGE_IGNORE_REGEX ]]; then
            continue
          fi
        fi
        VIEW_STORAGE=$(${KUBECTL} exec ${POD} -- sh -c "ls /storage") #this loads the volumes
        STORAGE_BYTES=$(${KUBECTL} exec ${POD} -- sh -c "du -s /storage/${PVC} | cut -f1")
        echo "$CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: ${PVC} uses ${STORAGE_BYTES} kilobytes"
        apiQuery "mutation {
          addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"${PVC}\", bytesUsed:${STORAGE_BYTES}}) {
            id
          }
        }"
        # Update namespace labels.
        if [ ! -z "$LAGOON_STORAGE_LABEL_NAMESPACE" ] ; then
          ${KUBECTL} label namespace $ENVIRONMENT_NAMESPACE lagoon/storage-${PVC}=${STORAGE_BYTES} --overwrite
        fi
      done
    fi

    if mariadb_size=$(${KUBECTL} exec ${POD} -- sh -c "if [ \"\$MARIADB_HOST\" ]; then mysql -N -s -h \$MARIADB_HOST -u\$MARIADB_USERNAME -p\$MARIADB_PASSWORD -P\$MARIADB_PORT -e 'SELECT ROUND(SUM(data_length + index_length) / 1024, 0) FROM information_schema.tables'; else exit 1; fi") && [ "$mariadb_size" ]; then
      echo "$CONSOLE_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: Database uses ${mariadb_size} kilobytes"
      apiQuery "mutation {
        addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"mariadb\", bytesUsed:${mariadb_size}}) {
          id
        }
      }"
      # Update namespace labels.
      if [ ! -z "$LAGOON_STORAGE_LABEL_NAMESPACE" ] ; then
        ${KUBECTL} label namespace $ENVIRONMENT_NAMESPACE lagoon/storage-mariadb=${mariadb_size} --overwrite
      fi
    fi

    ${KUBECTL} delete deployment/storage-calc  --ignore-not-found=true
    rm ${TMPFILE}

  done
done
