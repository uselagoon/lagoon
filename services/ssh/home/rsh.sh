#!/bin/bash

# takes arguments:
# 1: name of oc project
# checks for SSH_ORIGINAL_COMMAND

if [[ "$1" =~ ^[A-Za-z0-9-]+$ ]]; then
  project=$1
else
  echo "ERROR: no project defined";
  exit
fi

# convert $SSH_ORIGINAL_COMMAND into an array
IFS=', ' read -r -a command <<< "$SSH_ORIGINAL_COMMAND"

# the first argument is used as the deploymentconfig
if [[ "${command[1]}" =~ ^[A-Za-z0-9-]+$ ]]; then
  deploymentconfig=${command[1]}
else
  deploymentconfig=cli
fi

# remove the first argument
command=("${command[@]:1}")

#echo "project=${project}"
#echo "deploymentconfig=${deploymentconfig}"
#echo "SSH_ORIGINAL_COMMAND=${SSH_ORIGINAL_COMMAND}"
#echo "command=${command[@]}"

# If the deploymentconfig is scaled to 0, scale to 1
if [[ $(/usr/bin/oc -n ${project} get deploymentconfigs/${deploymentconfig} -o go-template --template='{{.status.replicas}}') == "0" ]]; then
  /usr/bin/oc -n ${project} scale --replicas=1 dc/${deploymentconfig} >/dev/null 2>&1
  # wait until the scaling is done
  while [[ ! $(/usr/bin/oc -n ${project} get deploymentconfigs/${deploymentconfig} -o go-template --template='{{.status.readyReplicas}}') == "1" ]]
  do
    sleep 1
  done
fi

if [ -z "$command" ]; then
  #echo "just running sh"
  exec /usr/bin/oc -n ${project} rsh dc/${deploymentconfig} sh
else
  #echo "running sh -c \"$command\""
  exec /usr/bin/oc -n ${project} rsh dc/${deploymentconfig} sh -c "$command"
fi