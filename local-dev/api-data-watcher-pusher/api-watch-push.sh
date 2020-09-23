#!/bin/bash

clear_gql_file_path="/api-data/00-clear-api-data.gql"
populate_general_gql_file_path="/api-data/01-populate-api-data-general.gql"
populate_openshift_gql_file_path="/api-data/02-populate-api-data-openshift.gql"
populate_kubernetes_gql_file_path="/api-data/03-populate-api-data-kubernetes.gql"
populate_controller_gql_file_path="/api-data/04-populate-api-data-controller.gql"
populate_controller_os_gql_file_path="/api-data/05-populate-api-data-controller-os.gql"

send_graphql_query() {
    local file_path=${1}

    API_ADMIN_JWT_TOKEN=$(/home/create_jwt.py)

    bearer="Authorization: bearer $API_ADMIN_JWT_TOKEN"

    # GraphQL query on single line with \\n for newlines and escaped quotes
    data=$(cat $file_path | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

    # Create a correct json string
    json="{\"query\": \"$data\"}"

    wget --header "Content-Type: application/json" --header "$bearer" api:3000/graphql --post-data "$json" --content-on-error -O -
}

watch_apidatafolder() {
    chsum_clear_prev=""
    chsum_populate_general_prev=""
    chsum_populate_openshift_prev=""
    chsum_populate_kubernetes_prev=""
    chsum_populate_controller_prev=""
    chsum_populate_controller_os_prev=""

    while [[ true ]]
    do
        chsum_clear_curr=`md5sum $clear_gql_file_path`
        chsum_populate_general_curr=`md5sum $populate_general_gql_file_path`
        chsum_populate_openshift_curr=`md5sum $populate_openshift_gql_file_path`
        chsum_populate_kubernetes_curr=`md5sum $populate_kubernetes_gql_file_path`
        chsum_populate_controller_curr=`md5sum $populate_controller_gql_file_path`
        chsum_populate_controller_os_curr=`md5sum $populate_controller_os_gql_file_path`

        if
            [[ $chsum_clear_prev != $chsum_clear_curr ]] ||
            [[ $chsum_populate_general_prev != $chsum_populate_general_curr ]] ||
            [[ $chsum_populate_openshift_prev != $chsum_populate_openshift_curr ]] ||
            [[ $chsum_populate_kubernetes_prev != $chsum_populate_kubernetes_curr ]] ||
            [[ $chsum_populate_controller_prev != $chsum_populate_controller_curr ]] ||
            [[ $chsum_populate_controller_os_prev != $chsum_populate_controller_os_curr ]];
        then
            echo "******* Found changes in gql files in /api-data/, clearing and re-populating"

            if
                send_graphql_query $clear_gql_file_path;
            then
                chsum_clear_prev=$chsum_clear_curr
            else
                echo '**** ERROR while clearing, will try again.'
            fi

            if
                send_graphql_query $populate_general_gql_file_path;
            then
                chsum_populate_general_prev=$chsum_populate_general_curr
            else
                echo "**** ERROR while re-populating $populate_general_gql_file_path, will try again."
            fi

            if
                send_graphql_query $populate_openshift_gql_file_path;
            then
                chsum_populate_openshift_prev=$chsum_populate_openshift_curr
            else
                echo "**** ERROR while re-populating $populate_openshift_gql_file_path, will try again."
            fi

            if
                send_graphql_query $populate_kubernetes_gql_file_path;
            then
                chsum_populate_kubernetes_prev=$chsum_populate_kubernetes_curr
            else
                echo "**** ERROR while re-populating $populate_kubernetes_gql_file_path, will try again."
            fi

            if
                send_graphql_query $populate_controller_gql_file_path;
            then
                chsum_populate_controller_prev=$chsum_populate_controller_curr
            else
                echo "**** ERROR while re-populating $populate_controller_gql_file_path, will try again."
            fi

            if
                send_graphql_query $populate_controller_os_gql_file_path;
            then
                chsum_populate_controller_os_prev=$chsum_populate_controller_os_curr
            else
                echo "**** ERROR while re-populating $populate_controller_os_gql_file_path, will try again."
            fi


        fi

        sleep 2
    done
}

watch_apidatafolder
