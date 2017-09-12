#!/bin/bash
git-hiera() {
    /usr/bin/git --git-dir=/home/git-dir --work-tree=/home/hiera "$@"
}

add_and_push() {
  git-hiera add . -v
  git-hiera commit -m "adding all hiera files"
  git-hiera push -f origin master
}


watch_hierafolder() {
    chsum1=""

    while [[ true ]]
    do
        chsum2=`find /home/hiera -type f -exec md5sum {} \;`
        if [[ $chsum1 != $chsum2 ]] ; then
            echo "******* found changes in /home/hiera, pushing to $GIT_REPO"
            if add_and_push; then
                chsum1=$chsum2
            else
                echo '**** ERROR while pushing, will try again.'
            fi
        fi
        sleep 2
    done
}

cd /home/hiera/

rm -rf .git || true

git-hiera init
git-hiera config remote.origin.url $GIT_REPO
watch_hierafolder