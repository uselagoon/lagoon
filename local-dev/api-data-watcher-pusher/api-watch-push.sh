#!/bin/bash

update() {
  mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < /home/api-data/api-data.sql
}


watch_apidatafolder() {
    chsum1=""

    while [[ true ]]
    do
        chsum2=`md5sum /home/api-data/api-data.sql`
        if [[ $chsum1 != $chsum2 ]] ; then
            echo "******* found changes in /home/api-data/api-data.sql, updating to api data"
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