#!/bin/bash

# inject variables from environment into the GQL template
envsubst '$GIT_HOST $GIT_PORT $INGRESS_IP $CONSOLE_URL $TOKEN' < /home/api-data/03-populate-api-data-ci-local-control-k8s.gql | sponge /home/api-data/03-populate-api-data-ci-local-control-k8s.gql

clear_gql_file_path="/home/api-data/00-clear-api-data.gql"
populate_demo_lagoon_gql_file_path="/home/api-data/01-populate-api-data-lagoon-demo.gql"
populate_demo_lagoon_org_gql_file_path="/home/api-data/02-populate-api-data-lagoon-demo-org.gql"
populate_ci_local_control_k8s_gql_file_path="/home/api-data/03-populate-api-data-ci-local-control-k8s.gql"
sample_task_file_path="/home/minio-data/task-files/sample-task-file.txt"

wait_for_services() {
    echo "waiting for ${API_HOST:-api}:${API_PORT:-3000}"
    wait-for ${API_HOST:-api}:${API_PORT:-3000} -t 600
    echo "connected to API"
}

send_graphql_query() {
    local file_path=${1}

    API_ADMIN_JWT_TOKEN=$(/home/create_jwt.py)

    bearer="Authorization: bearer $API_ADMIN_JWT_TOKEN"

    # GraphQL query on single line with \\n for newlines and escaped quotes
    data=$(cat $file_path | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

    # Create a correct json string
    json="{\"query\": \"$data\"}"

    wget --header "Content-Type: application/json" --header "$bearer" "${API_HOST:-api}:${API_PORT:-3000}/graphql" --post-data "$json" --content-on-error -O -
}

update_minio_files() {
	mcli config host add local-minio ${MINIO_SERVER_URL-http://local-minio:9000} ${MINIO_ROOT_USER:-minio} ${MINIO_ROOT_PASSWORD:-minio123}
	mcli cp --recursive /home/minio-data/lagoon-files/ local-minio/lagoon-files
	mcli cp --recursive /home/minio-data/restores/ local-minio/restores
}

send_task_data() {
    local task_id=${1}
    local file_path=${2}

    API_ADMIN_JWT_TOKEN=$(/home/create_jwt.py)

    bearer="Authorization: bearer $API_ADMIN_JWT_TOKEN"

    curl -sS "${API_HOST:-api}:${API_PORT:-3000}/graphql" \
        -H "${bearer}" \
        -F operations='{ "query": "mutation ($task: Int!, $files: [Upload!]!) { uploadFilesForTask(input:{task:$task, files:$files}) { id files { filename } } }", "variables": { "task": '"${task_id}"', "files": [null] } }' \
        -F map='{ "0": ["variables.files.0"] }' \
        -F 0=@${file_path}
}

# Waiting for the API to be ready
wait_for_services

# Optionally clear *some* API data prior to reloading - not really necessary any more
# send_graphql_query $clear_gql_file_path

# Create the lagoon-demo project and associated users, groups, deployments, tasks etc
send_graphql_query $populate_demo_lagoon_gql_file_path

# Add the deployment and task logs
update_minio_files

# Add the task file to a sample task
send_task_data 124 $sample_task_file_path

# Create the lagoon-demo-org Organization and related users, groups and projects
send_graphql_query $populate_demo_lagoon_org_gql_file_path

# Prepare the api with the necessary test fixtures for ci-local-control-k8s testing
# send_graphql_query $populate_ci_local_control_k8s_gql_file_path

echo "Lagoon init complete"
touch /tmp/api-data-pushed
