#!/bin/bash

update() {
    cd /lagoon/kibana-init; sh index-patterns.sh
    cd /lagoon/kibana-init; sh watchers.sh
}



watch_kibanafolder() {
    chsum1=""

    while [[ true ]]
    do
        chsum2=`tar -cf - /lagoon/kibana-init/ | md5sum`
        if [[ $chsum1 != $chsum2 ]] ; then
            echo "******* found changes in /lagoon/kibana-init.sh, updating"
            if update; then
                chsum1=$chsum2
            else
                echo '**** ERROR while updating, will try again.'
            fi
        fi
        sleep 2
    done
}

watch_kibanafolder
