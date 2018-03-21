#!/bin/bash

# takes arguments:
# 1: name of oc project
# checks for SSH_ORIGINAL_COMMAND

# check which project
if [[ -n "$1" ]]; then
  if [[ "$1" =~ ^[A-Za-z0-9-]+$ ]]; then
    project=$1
  else
    echo "ERROR: given project '$1' contains illegal characters";
    exit
  fi
else
  echo "ERROR: no project defined";
  exit 1
fi

# use $SSH_ORIGINAL_COMMAND to the argument list
set -- $SSH_ORIGINAL_COMMAND

# if [[ -z "$1" ]]; then # if no argument defined anymore, we assume they want to connect to the cli
#   deploymentconfig=cli
# elif [[ "$1" = "cd" && "$4" = "bash" ]]; then # Drush connects with something like `cd /app/web && bash -l`, we are checking on that and assuming cli as the deploymentconfig
#   deploymentconfig=cli
# elif [[ "$1" = "env" && "$3" = "drush" ]]; then # Drush connects with something like `env COLUMNS=259  drush`, we are checking on that and assuming cli as the deploymentconfig
#   deploymentconfig=cli
# elif [[ "$1" = "rsync" ]]; then # Drush connects with something like `env COLUMNS=259  drush`, we are checking on that and assuming cli as the deploymentconfig
  deploymentconfig=cli
# else # argument is given, check if its a valid one
#   if [[ "$1" =~ ^[A-Za-z0-9-]+$ ]]; then
#     deploymentconfig=$1

#     # remove deploymentconfig argument from argument list
#     shift
#   else
#     echo "ERROR: given deploymentconfig '$1' contains illegal characters";
#     exit 1
#   fi
# fi

echo "Incoming Remote Shell Connection: project='${project}' deploymentconfig='${deploymentconfig}' command='$*'"  >> /proc/1/fd/1

# If the deploymentconfig is scaled to 0, scale to 1
if [[ $(/usr/bin/oc -n ${project} get deploymentconfigs/${deploymentconfig} -o go-template --template='{{.status.replicas}}') == "0" ]]; then
  /usr/bin/oc -n ${project} scale --replicas=1 dc/${deploymentconfig} >/dev/null 2>&1
  # wait until the scaling is done
  while [[ ! $(/usr/bin/oc -n ${project} get deploymentconfigs/${deploymentconfig} -o go-template --template='{{.status.readyReplicas}}') == "1" ]]
  do
    sleep 1
  done
fi

if [[ -z "$*" ]]; then
  exec /usr/bin/oc -n ${project} rsh dc/${deploymentconfig} sh
else
  exec /usr/bin/oc -n ${project} rsh dc/${deploymentconfig} sh -c "$*"
fi