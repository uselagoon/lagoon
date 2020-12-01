#!/bin/bash

API_ADMIN_JWT_TOKEN=$(./create_jwt.py)
BEARER="Authorization: bearer $API_ADMIN_JWT_TOKEN"

# Load all projects and their environments
GRAPHQL='query environments {
  environments:allProjects {
    name
    storageCalc
    openshift {
      consoleUrl
      token
      name
    }
    environments {
      openshiftProjectName
      name
      id
    }
  }
}'

# Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
query=$(echo $GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
ALL_ENVIRONMENTS=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$query\"}")

echo "$ALL_ENVIRONMENTS" | jq -c '.data.environments[] | select((.environments|length)>=1)' | while read project
do
  PROJECT_NAME=$(echo "$project" | jq -r '.name')
  OPENSHIFT_URL=$(echo "$project" | jq -r '.openshift.consoleUrl')
  # Match the Project name to the Project Regex
  if [[ $PROJECT_NAME =~ $PROJECT_REGEX ]]; then
    STORAGE_CALC=$(echo "$project" | jq -r '.storageCalc')
    echo "$OPENSHIFT_URL: Handling project $PROJECT_NAME"
    OPENSHIFT_TOKEN=$(echo "$project" | jq -r '.openshift.token')
    # loop through each environment of the current project
    echo "$project" | jq -c '.environments[]' | while read environment
    do
      ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshiftProjectName')
      ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
      ENVIRONMENT_ID=$(echo "$environment" | jq -r '.id')

      echo "$OPENSHIFT_URL - $PROJECT_NAME: handling development environment $ENVIRONMENT_NAME"

      if [[ $STORAGE_CALC != "1" ]]; then
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: storage calculation disabled, skipping"

        MUTATION="mutation addOrUpdateEnvironmentStorage {
          addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"storage-calc-disabled\", bytesUsed:0}) {
            id
          }
        }"

        # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
        query=$(echo $MUTATION | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
        curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$query\"}"

        continue

      fi

      OC="oc --insecure-skip-tls-verify --token=$OPENSHIFT_TOKEN --server=$OPENSHIFT_URL -n $ENVIRONMENT_OPENSHIFT_PROJECTNAME"

      # Skip if namespace doesn't exist.
      if ! ${OC} get ns ${ENVIRONMENT_OPENSHIFT_PROJECTNAME} >/dev/null 2>&1 ; then
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no valid namespace found"
        continue
      fi

      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: creating storage-calc pod"

      # Cleanup any existing storage-calc deployments
      ${OC} delete deploymentconfig/storage-calc >/dev/null 2>&1

      # Start storage-calc deployment
      ${OC} run --generator=deploymentconfig/v1 --image imagecache.amazeeio.cloud/amazeeio/alpine-mysql-client storage-calc -- sh -c "while sleep 3600; do :; done"
      ${OC} rollout pause deploymentconfig/storage-calc

      # Copy environment variable from lagoon-env configmap.
      ${OC} set env --from=configmap/lagoon-env deploymentconfig/storage-calc

      PVCS=($(${OC} get pvc -o name | sed 's/persistentvolumeclaim\///'))

      for PVC in "${PVCS[@]}"
      do
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: mounting ${PVC} into storage-calc"
        ${OC} set volume deploymentconfig/storage-calc --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage/${PVC}
      done

      ${OC} rollout resume deploymentconfig/storage-calc
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: redeploying storage-calc to mount volumes"
      ${OC} rollout status deploymentconfig/storage-calc --watch

      POD=$(${OC} get pods -l run=storage-calc -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')

      if [[ ! $POD ]]; then
        echo "No running pod found for storage-calc"
        # Clean up any failed deployments.
        ${OC} delete deploymentconfig/storage-calc >/dev/null 2>&1
        exit 1
      fi

      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: loading storage information"

      if [[ ! ${#PVCS[@]} -gt 0 ]]; then
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no PVCs found writing API with 0 bytes"

        MUTATION="mutation addOrUpdateEnvironmentStorage {
          addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"none\", bytesUsed:0}) {
            id
          }
        }"

        # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
        query=$(echo $MUTATION | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
        curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$query\"}"

      else
        for PVC in "${PVCS[@]}"
        do
          STORAGE_BYTES=$(${OC} exec ${POD} -- sh -c "du -s /storage/${PVC} | cut -f1")
          # STORAGE_BYTES=$(echo "${DF}" | grep /storage/${PVC} | awk '{ print $4 }')
          echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: ${PVC} uses ${STORAGE_BYTES} kilobytes"

            MUTATION="mutation addOrUpdateEnvironmentStorage {
              addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"${PVC}\", bytesUsed:${STORAGE_BYTES}}) {
                id
              }
            }"

            # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
            query=$(echo $MUTATION | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
            curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$query\"}"

            # Update namespace labels
            if [ ! -z "$LAGOON_STORAGE_LABEL_NAMESPACE"]; then
              ${OC} label namespace $ENVIRONMENT_OPENSHIFT_PROJECTNAME lagoon/storage-${PVC}=${STORAGE_BYTES} --overwrite
            fi

        done
      fi

      if mariadb_size=$(${OC} exec ${POD} -- sh -c "if [ \"\$MARIADB_HOST\" ]; then mysql -N -s -h \$MARIADB_HOST -u\$MARIADB_USERNAME -p\$MARIADB_PASSWORD -P\$MARIADB_PORT -e 'SELECT ROUND(SUM(data_length + index_length) / 1024, 0) FROM information_schema.tables'; else exit 1; fi") && [ "$mariadb_size" ]; then
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: Database uses ${mariadb_size} kilobytes"

        MUTATION="mutation addOrUpdateEnvironmentStorage {
          addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistentStorageClaim:\"mariadb\", bytesUsed:${mariadb_size}}) {
            id
          }
        }"

        # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
        query=$(echo $MUTATION | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
        curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$query\"}"
      fi

      ${OC} delete deploymentconfig/storage-calc

    done
  else
    echo "$OPENSHIFT_URL - $PROJECT_NAME: SKIP, does not match Regex: $PROJECT_REGEX"
  fi
done
