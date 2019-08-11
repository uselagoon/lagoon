#!/bin/bash

clear_gql_file_path="/api-data/00-clear-api-data.gql"
populate_gql_file_path="/api-data/01-populate-api-data.gql"

send_graphql_query() {
    local file_path=${1}

    API_ADMIN_JWT_TOKEN=$(/home/create_jwt.sh)

    bearer="Authorization: bearer $API_ADMIN_JWT_TOKEN"

    # GraphQL query on single line with \\n for newlines and escaped quotes
    data=$(cat $file_path | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

    # Create a correct json string
    json="{\"query\": \"$data\"}"

    wget --header "Content-Type: application/json" --header "$bearer" api:3000/graphql --post-data "$json" --content-on-error -O -
}

watch_apidatafolder() {
    chsum_clear_prev=""
    chsum_populate_prev=""

    while [[ true ]]
    do
        chsum_clear_curr=`md5sum $clear_gql_file_path`
        chsum_populate_curr=`md5sum $populate_gql_file_path`

        if
            [[ $chsum_clear_prev != $chsum_clear_curr ]] ||
            [[ $chsum_populate_prev != $chsum_populate_curr ]];
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
                send_graphql_query $populate_gql_file_path;
            then
                chsum_populate_prev=$chsum_populate_curr
            else
                echo '**** ERROR while re-populating, will try again.'
            fi
        fi

        sleep 2
    done
}

watch_apidatafolder
