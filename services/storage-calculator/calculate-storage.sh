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
      openshiftProjectName
      name
      id
      openshift {
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
  if ! [[ $PROJECT_NAME =~ $PROJECT_REGEX ]]; then
    echo "Project: $PROJECT_NAME [skip, does not match regex: ${PROJECT_REGEX}]"
    continue
  fi

  STORAGE_CALC=$(echo "$PROJECT" | jq -r '.storageCalc')
  echo "Project: $PROJECT_NAME [storage calc: ${STORAGE_CALC}]"

  # Loop through the environments.
  echo "$PROJECT" | jq -c '.environments[]' | while read environment ; do
    OPENSHIFT_URL=$(echo "$environment" | jq -r '.openshift.consoleUrl')
    OPENSHIFT_TOKEN=$(echo "$environment" | jq -r '.openshift.token // empty')
    ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshiftProjectName')
    ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
    ENVIRONMENT_ID=$(echo "$environment" | jq -r '.id')

    echo " > $OPENSHIFT_URL - $PROJECT_NAME: environment $ENVIRONMENT_NAME"

    if [[ $STORAGE_CALC != "1" ]]; then
      echo " > $OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: storage calculation disabled, skipping"
        apiQuery "mutation {
          addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"storage-calc-disabled\", bytesUsed:0}) {
            id
          }
        }"
      continue
    fi

    OC="oc --insecure-skip-tls-verify --token=$OPENSHIFT_TOKEN --server=$OPENSHIFT_URL -n $ENVIRONMENT_OPENSHIFT_PROJECTNAME"

    # Skip if namespace doesn't exist.
    NAMESPACE=$(${OC} get namespace ${ENVIRONMENT_OPENSHIFT_PROJECTNAME} --ignore-not-found=true);
    if ! [[ "$NAMESPACE" ]]; then
      echo " > $OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no valid namespace found"
      continue
    fi

    echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: creating storage-calc pod"

    # Cleanup any existing storage-calc deployments.
    ${OC} delete deployment/storage-calc --ignore-not-found=true

    # Start storage-calc deployment.
    deployment_template=$(${OC} create --dry-run=true -o yaml deployment storage-calc --image imagecache.amazeeio.cloud/amazeeio/alpine-mysql-client)
    deployment=$(echo "$deployment_template" | yq '.spec.template.spec.containers[0].command = ["sh", "-c", "while sleep 3600; do :; done"]')
    echo "$deployment" | ${OC} create -f -
    ${OC} rollout pause deployment/storage-calc

    # Copy environment variable from lagoon-env configmap.
    ${OC} set env --from=configmap/lagoon-env deployment/storage-calc

    PVCS=($(${OC} get pvc -o name | sed 's/persistentvolumeclaim\///'))

    for PVC in "${PVCS[@]}" ; do
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: mounting ${PVC} into storage-calc"
      ${OC} set volume deployment/storage-calc --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage/${PVC}
    done

    ${OC} rollout resume deployment/storage-calc
    echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: redeploying storage-calc to mount volumes"
    ${OC} rollout status deployment/storage-calc --watch --timeout=1m

    POD=$(${OC} get pods -l app=storage-calc -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')

    if [[ ! $POD ]]; then
      echo "No running pod found for storage-calc"
      ${OC} delete deployment/storage-calc --ignore-not-found=true
      continue
    fi

    echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: loading storage information"

    if [[ ! ${#PVCS[@]} -gt 0 ]] ; then
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no PVCs found writing API with 0 bytes"
      apiQuery "mutation {
        addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"none\", bytesUsed:0}) {
          id
        }
      }"

    else
      for PVC in "${PVCS[@]}" ; do
        STORAGE_BYTES=$(${OC} exec ${POD} -- sh -c "du -s /storage/${PVC} | cut -f1")
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: ${PVC} uses ${STORAGE_BYTES} kilobytes"
        apiQuery "mutation {
          addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"${PVC}\", bytesUsed:${STORAGE_BYTES}}) {
            id
          }
        }"

        # Update namespace labels.
        if [ ! -z "$LAGOON_STORAGE_LABEL_NAMESPACE" ]; then
          ${OC} label namespace $ENVIRONMENT_OPENSHIFT_PROJECTNAME lagoon/storage-${PVC}=${STORAGE_BYTES} --overwrite
        fi

      done
    fi

    if mariadb_size=$(${OC} exec ${POD} -- sh -c "if [ \"\$MARIADB_HOST\" ]; then mysql -N -s -h \$MARIADB_HOST -u\$MARIADB_USERNAME -p\$MARIADB_PASSWORD -P\$MARIADB_PORT -e 'SELECT ROUND(SUM(data_length + index_length) / 1024, 0) FROM information_schema.tables'; else exit 1; fi") && [ "$mariadb_size" ]; then
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: Database uses ${mariadb_size} kilobytes"
      apiQuery "mutation {
        addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"mariadb\", bytesUsed:${mariadb_size}}) {
          id
        }
      }"
    fi

    ${OC} delete deployment/storage-calc  --ignore-not-found=true

  done
done