#!/bin/bash

update() {
    . /kibana-init/index-patterns.sh
    . /kibana-init/watchers.sh
}



watch_kibanafolder() {
    chsum1=""

    while [[ true ]]
    do
        chsum2=`tar -cf - /kibana-init/ | md5sum`
        if [[ $chsum1 != $chsum2 ]] ; then
            echo "******* found changes in /home/kibana-init.sh, updating"
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
