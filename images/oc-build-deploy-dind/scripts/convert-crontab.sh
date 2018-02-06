#!/bin/bash

# no globbing
set -f

function join { local IFS="$1"; shift; echo "$*"; }

index=0

while read piece
do

  # Minutes
  if [ "$index" = "0" ]; then
    if [[ $piece =~ ^H$ ]]; then
      # If just an H is defined, we generate a random minute
      MINUTES=$((0 + RANDOM % 59))

    elif [[ $piece =~ ^H|\*\/([0-5]?[0-9])$ ]]; then
      # A Minute like H/15 or (*/15 for backwards compatibility) is defined, create a list of minutes with a random start
      # like 4,19,34,49 or 6,21,36,51
      STEP=${BASH_REMATCH[1]}
      if [ $STEP -lt 15 ]; then
        echo "cronjobs with less than 15 minute steps are not supported"; exit 1
      fi
      # Generate a random start within the given step to prevent that all cronjobs start at the same time
      # but still incorporate the wished step
      COUNTER=$((0 + RANDOM % $STEP))
      MINUTES_ARRAY=()
      while [ $COUNTER -lt 60 ]; do
          MINUTES_ARRAY+=($COUNTER)
          let COUNTER=COUNTER+$STEP
      done
      MINUTES=$(join , ${MINUTES_ARRAY[@]})

    elif [[ $piece =~ ^([0-5]?[0-9])(,[0-5]?[0-9])*$ ]]; then
      MINUTES=$piece

    elif [[ $piece =~ ^\*$ ]]; then
      echo "cronjobs with less than 15 minute steps are not supported"; exit 1

    else
      echo "error parsing cronjob minute: '$piece'"; exit 1

    fi

  #Hours
  elif [ "$index" = "1" ]; then
    if [[ $piece =~ ^H$ ]]; then
      # If just an H is defined, we generate a random hour
      HOURS=$((0 + RANDOM % 23))
    else
      HOURS=$piece
    fi

  #Days
  elif [ "$index" = "2" ]; then
    DAYS=$piece

  #Month
  elif [ "$index" = "3" ]; then
    MONTHS=$piece

  #Day of Week
  elif [ "$index" = "4" ]; then
    DAY_WEEK="$piece"
  fi
  #increment index
  index=$((index+1))

done < <(echo $1 | tr " " "\n")

echo "${MINUTES} ${HOURS} ${DAYS} ${MONTHS} ${DAY_WEEK}"