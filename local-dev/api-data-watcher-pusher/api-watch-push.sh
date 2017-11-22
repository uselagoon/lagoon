#!/bin/bash

JWTSECRET=super-secret-string
JWTAUDIENCE=api.dev

API_ADMIN_JWT_TOKEN=$(/home/create_jwt.sh $JWTSECRET $JWTAUDIENCE)

bearer="Authorization: bearer $API_ADMIN_JWT_TOKEN"

update() {
    # Convert GraphQL file into single line (but with still \n existing), turn \n into \\n, esapee the Quotes
    data=$(cat /api-data/api-data.gql | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
    # create a correct json
    json="{\"query\": \"$data\"}"
    wget --header "Content-Type: application/json" --header "$bearer" api:3000/graphql --post-data "$json" -O -
}


watch_apidatafolder() {
    chsum1=""

    while [[ true ]]
    do
        chsum2=`md5sum /api-data/api-data.gql`
        if [[ $chsum1 != $chsum2 ]] ; then
            echo "******* found changes in /api-data/api-data.sql, updating to api data"
            if update; then
                chsum1=$chsum2
            else
                echo '**** ERROR while updating, will try again.'
            fi
        fi
        sleep 2
    done
}

watch_apidatafolder