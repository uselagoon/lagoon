#!/bin/bash

API_ADMIN_JWT_TOKEN=$(./create_jwt.sh)
BEARER="Authorization: bearer $API_ADMIN_JWT_TOKEN"

# Load all projects and their environments
GRAPHQL='query environments {
  environments:allProjects {
    name
    storage_calc
    openshift {
      console_url
      token
      name
    }
    environments {
      openshift_projectname
      name
      id
    }
  }
}'

# Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
query=$(echo $GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
ALL_ENVIRONMENTS=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" api:3000/graphql -d "{\"query\": \"$query\"}")

echo "$ALL_ENVIRONMENTS" | jq -c '.data.environments[] | select((.environments|length)>=1)' | while read project
do
  PROJECT_NAME=$(echo "$project" | jq -r '.name')
  OPENSHIFT_URL=$(echo "$project" | jq -r '.openshift.console_url')
  STORAGE_CALC=$(echo "$project" | jq -r '.storage_calc')
  echo "$OPENSHIFT_URL: Handling project $PROJECT_NAME"
  OPENSHIFT_TOKEN=$(echo "$project" | jq -r '.openshift.token')
  # loop through each environment of the current project
  echo "$project" | jq -c '.environments[]' | while read environment
  do
    ENVIRONMENT_OPENSHIFT_PROJECTNAME=$(echo "$environment" | jq -r '.openshift_projectname')
    ENVIRONMENT_NAME=$(echo "$environment" | jq -r '.name')
    ENVIRONMENT_ID=$(echo "$environment" | jq -r '.id')

    echo "$OPENSHIFT_URL - $PROJECT_NAME: handling development environment $ENVIRONMENT_NAME"

    if [[ $STORAGE_CALC != "1" ]]; then
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: storage calculation disabled, skipping"

      MUTATION="mutation addOrUpdateEnvironmentStorage {
        addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistent_storage_claim:\"storage-calc-disabled\", bytes_used:0}) {
          id
        }
      }"

      continue

    fi

    # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
    query=$(echo $MUTATION | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
    curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" api:3000/graphql -d "{\"query\": \"$query\"}"

    OC="oc --insecure-skip-tls-verify --token=$OPENSHIFT_TOKEN --server=$OPENSHIFT_URL -n $ENVIRONMENT_OPENSHIFT_PROJECTNAME"

    PVCS=($(${OC} get pvc -o name | sed 's/persistentvolumeclaims\///'))

    if [[ ! ${#PVCS[@]} -gt 0 ]]; then
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: no PVCs found writing API with 0 bytes"

      MUTATION="mutation addOrUpdateEnvironmentStorage {
        addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistent_storage_claim:\"none\", bytes_used:0}) {
          id
        }
      }"

      # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
      query=$(echo $MUTATION | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
      curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" api:3000/graphql -d "{\"query\": \"$query\"}"

    else
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: creating storage-calc pod"

      ${OC} run --image alpine storage-calc -- sh -c "while sleep 3600; do :; done"
      ${OC} rollout pause deploymentconfig/storage-calc

      for PVC in "${PVCS[@]}"
      do
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: mounting ${PVC} into storage-calc"
        ${OC} volume deploymentconfig/storage-calc --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage/${PVC}
      done

      ${OC} rollout resume deploymentconfig/storage-calc
      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: redeploying storage-calc to mount volumes"
      ${OC} rollout status deploymentconfig/storage-calc --watch

      POD=$(${OC} get pods -l run=storage-calc -o json | jq -r '.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running") | .metadata.name' | head -n 1)

      if [[ ! $POD ]]; then
        echo "No running pod found for storage-calc"
        exit 1
      fi

      echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: loading storage information"

      for PVC in "${PVCS[@]}"
      do
        STORAGE_BYTES=$(${OC} exec ${POD} -- sh -c "du -s /storage/${PVC} | cut -f1")
        # STORAGE_BYTES=$(echo "${DF}" | grep /storage/${PVC} | awk '{ print $4 }')
        echo "$OPENSHIFT_URL - $PROJECT_NAME - $ENVIRONMENT_NAME: ${PVC} uses ${STORAGE_BYTES} bytes"

        MUTATION="mutation addOrUpdateEnvironmentStorage {
          addOrUpdateEnvironmentStorage(input:{environment:${ENVIRONMENT_ID}, persistent_storage_claim:\"${PVC}\", bytes_used:${STORAGE_BYTES}}) {
            id
          }
        }"

        # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
        query=$(echo $MUTATION | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
        curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" api:3000/graphql -d "{\"query\": \"$query\"}"

      done

      ${OC} delete deploymentconfig/storage-calc
    fi
  done
done

