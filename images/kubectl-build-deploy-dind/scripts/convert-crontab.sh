#!/bin/bash -e

# no globbing
set -f

function join { local IFS="$1"; shift; echo "$*"; }

index=0

# Seed is used to generate pseudo random numbers. The seed is based on the
# namespace, so will not change after a deployment for a given namespace.
SEED=$(echo "$1" | cksum | cut -f 1 -d " ")

while read piece
do

  # Minutes
  if [ "$index" = "0" ]; then
    if [[ $piece =~ ^(M|H)$ ]]; then
      # If just an `M` or `H` (for backwards compatibility) is defined, we
      # generate a pseudo random minute.
      MINUTES=$((SEED % 60))

    elif [[ $piece =~ ^(M|H|\*)\/([0-5]?[0-9])$ ]]; then
      # A Minute like M/15 (or H/15 or */15 for backwards compatibility) is defined, create a list of minutes with a random start
      # like 4,19,34,49 or 6,21,36,51
      STEP=${BASH_REMATCH[2]}
      # Generate a random start within the given step to prevent that all cronjobs start at the same time
      # but still incorporate the wished step
      COUNTER=$((SEED % $STEP))
      MINUTES_ARRAY=()
      while [ $COUNTER -lt 60 ]; do
          MINUTES_ARRAY+=($COUNTER)
          let COUNTER=COUNTER+$STEP
      done
      MINUTES=$(join , ${MINUTES_ARRAY[@]})

    elif [[ $piece =~ ^([0-5]?[0-9])(,[0-5]?[0-9])*$ ]]; then
      MINUTES=$piece

    elif [[ $piece =~ ^\*$ ]]; then
      MINUTES=$piece

    else
      echo "error parsing cronjob minute: '$piece'"; exit 1

    fi

  # Hours
  elif [ "$index" = "1" ]; then
    if [[ $piece =~ ^H$ ]]; then
      # If just an `H` is defined, we generate a pseudo random hour.
      HOURS=$((SEED % 24))
    elif [[ $piece =~ ^H\(([01]?[0-9]|2[0-3])-([01]?[0-9]|2[0-3])\)$ ]]; then
      # If H is defined with a given range, example: H(2-4), we generate a random hour between 2-4
      HOUR_FROM=${BASH_REMATCH[1]}
      HOUR_TO=${BASH_REMATCH[2]}
      if (( HOUR_FROM < HOUR_TO )); then
        # Example: HOUR_FROM: 2, HOUR_TO: 4
        # Calculate the difference between the two hours (in example will be 2)
        MAX_DIFFERENCE=$((HOUR_TO - HOUR_FROM))
        # Generate a difference based on the SEED (in example will be 0, 1 or 2)
        DIFFERENCE=$((SEED % MAX_DIFFERENCE))
        # Add the generated difference to the FROM hour (in example will be 2, 3 or 4)
        HOURS=$((HOUR_FROM + DIFFERENCE))
      elif (( HOUR_FROM > HOUR_TO )); then
        # If the FROM is larger than the TO, we have a range like 22-2
        # Calculate the difference between the two hours with a 24 hour jump (in example will be 4)
        MAX_DIFFERENCE=$((24 - HOUR_FROM + HOUR_TO))
        # Generate a difference based on the SEED (in example will be 0, 1, 2, 3 or 4)
        DIFFERENCE=$((SEED % MAX_DIFFERENCE))
        # Add the generated difference to the FROM hour (in example will be 22, 23, 24, 25 or 26)
        HOURS=$((HOUR_FROM + DIFFERENCE))
        if (( HOURS >= 24 )); then
          # If the hour is higher than 24, we subtract 24 to handle the midnight change
          HOURS=$((HOURS - 24))
        fi
      elif (( HOUR_FROM = HOUR_TO )); then
        HOURS=$HOUR_FROM
      fi
    else
      HOURS=$piece
    fi

  # Days
  elif [ "$index" = "2" ]; then
    DAYS=$piece

  # Month
  elif [ "$index" = "3" ]; then
    MONTHS=$piece

  # Day of Week
  elif [ "$index" = "4" ]; then
    DAY_WEEK="$piece"
  fi

  index=$((index+1))

done < <(echo $2 | tr " " "\n")

echo "${MINUTES} ${HOURS} ${DAYS} ${MONTHS} ${DAY_WEEK}"
