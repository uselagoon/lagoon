#!/bin/bash

# Open a remote shell session to a container

# takes arguments:
# $1: API JWT Admin Token
# $2: ssh public key of the connecting user
# $3: name of oc project
# Optional:
#   service=xxx (service to connect to)
#   container=xxx (container to connect to)
#   any additonal parameters (run in the container via 'sh -c')

API_ADMIN_TOKEN=$1
USER_SSH_KEY=$2
REQUESTED_PROJECT=$3
shift 3

# get the value from an envvar override (can be added to the ssh deployment)
# default to false so we don't hold up the ssh for a long time
WAIT_TO_UNIDLE_SERVICES=${WAIT_TO_UNIDLE_SERVICES:-false}
# set a timeout of 120 for waiting for a pod to start (the waits are 5 second interval, so 10 minutes timeout)
SSH_CHECK_TIMEOUT=${SSH_CHECK_TIMEOUT:-120}

# generate a random uuid for this request to help track in logs
# also the uuid will be given to users in any errors so they can provide it to help with tracking too if required
# which makes going through logs easier
UUID=$(cat /proc/sys/kernel/random/uuid)

# get the graphql endpoint, if set
eval "$(grep GRAPHQL_ENDPOINT /authorize.env)"

# check if project is a valid one
if [[ -n "$REQUESTED_PROJECT" ]]; then
  if [[ "$REQUESTED_PROJECT" =~ ^[A-Za-z0-9-]+$ ]]; then
    PROJECT=$REQUESTED_PROJECT
  else
    echo "${UUID}: ERROR: given project '$REQUESTED_PROJECT' contains illegal characters";
    exit 1
  fi
else
  echo "${UUID}: ERROR: no project defined";
  exit 1
fi

##
## Check if this user has access to this OpenShift project by using an API token of that user
##
TOKEN=$(./token.sh "$API_ADMIN_TOKEN" "$USER_SSH_KEY")
BEARER="Authorization: bearer $TOKEN"
GRAPHQL="query userCanSshToEnvironment {
  userCanSshToEnvironment(openshiftProjectName: \"$PROJECT\") {
    openshiftProjectName
  }
}"
# GraphQL query on single line with \\n for newlines and escaped quotes
QUERY=$(echo $GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
ENVIRONMENT=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$QUERY\"}")

# Check if the returned OpenShift projectname is the same as the one being requested. This will only be true if the user actually has access to this environment
if [[ ! "$(echo $ENVIRONMENT | jq --raw-output '.data.userCanSshToEnvironment.openshiftProjectName')" == "$PROJECT" ]]; then
  echo "${UUID}: no access to $PROJECT"
  exit 1
fi

##
## Get OpenShift Console URL and Token with Admin Token
##
ADMIN_BEARER="Authorization: bearer $API_ADMIN_TOKEN"
ADMIN_GRAPHQL="query getEnvironmentByOpenshiftProjectName {
  environmentByOpenshiftProjectName(openshiftProjectName: \"$PROJECT\") {
    project {
      openshift {
        consoleUrl
        token
        name
      }
    }
    openshift {
      consoleUrl
      token
      name
    }
  }
}"
# GraphQL query on single line with \\n for newlines and escaped quotes
ADMIN_QUERY=$(echo $ADMIN_GRAPHQL | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
ADMIN_ENVIRONMENT=$(curl -s -XPOST -H 'Content-Type: application/json' -H "$ADMIN_BEARER" "${GRAPHQL_ENDPOINT:-api:3000/graphql}" -d "{\"query\": \"$ADMIN_QUERY\"}")

CLUSTER_CONSOLE=$(echo $ADMIN_ENVIRONMENT | jq --raw-output '.data.environmentByOpenshiftProjectName.openshift.consoleUrl')
CLUSTER_TOKEN=$(echo $ADMIN_ENVIRONMENT | jq --raw-output '.data.environmentByOpenshiftProjectName.openshift.token')
CLUSTER_NAME=$(echo $ADMIN_ENVIRONMENT | jq --raw-output '.data.environmentByOpenshiftProjectName.openshift.name')
# if no cluster is found at the environment level (introduced in lagoon2.1) then grab what is at the project level
if [[ -z ${CLUSTER_NAME} ]]; then
  CLUSTER_CONSOLE=$(echo $ADMIN_ENVIRONMENT | jq --raw-output '.data.environmentByOpenshiftProjectName.project.openshift.consoleUrl')
  CLUSTER_TOKEN=$(echo $ADMIN_ENVIRONMENT | jq --raw-output '.data.environmentByOpenshiftProjectName.project.openshift.token')
  CLUSTER_NAME=$(echo $ADMIN_ENVIRONMENT | jq --raw-output '.data.environmentByOpenshiftProjectName.project.openshift.name')
fi

##
## Check if we have a service and container given, if yes use them.
## Fallback is the cli service
##
if [[ $1 =~ ^service=([A-Za-z0-9-]+)$ ]]; then
  SERVICE=${BASH_REMATCH[1]}
  shift

  if [[ $1 =~ ^container=([A-Za-z0-9-]+)$ ]]; then
    CONTAINER=${BASH_REMATCH[1]}
    shift
  fi
else
  SERVICE=cli
fi

echo "${UUID}: Incoming Remote Shell Connection: project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}' container='${CONTAINER}' command='$*'"  >> /proc/1/fd/1

# This only happens on local development with minishift.
# Login as developer:deveeloper and get the token
if [[ $CLUSTER_TOKEN == "null" ]]; then
  KUBECONFIG="/tmp/kube" /usr/bin/oc --insecure-skip-tls-verify login -p developer -u developer ${CLUSTER_CONSOLE} > /dev/null
  CLUSTER_TOKEN=$(KUBECONFIG="/tmp/kube" oc --insecure-skip-tls-verify whoami -t)
fi

OC="/usr/bin/oc --insecure-skip-tls-verify -n ${PROJECT} --token=${CLUSTER_TOKEN} --server=${CLUSTER_CONSOLE} "

IS_KUBERNETES=false

# If there is a deployment for the given service searching for lagoon.sh labels
if [[ $($OC get deployment -l "lagoon.sh/service=${SERVICE}" 2> /dev/null) ]]; then
  IS_KUBERNETES=true
  # get any other deployments that may have been idled by the idler and unidle them if required
  # this only needs to be done for kubernetes
  # we do this first to give the services a bit of time to unidle before starting the one that was requested
  DEPLOYMENTS=$($OC get deployments -l "idling.amazee.io/watch=true" -o name)
  if [ ! -z "${DEPLOYMENTS}" ]; then
    echo "${UUID}: Environment is idled attempting to scale up for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
    # loop over the deployments and unidle them
    for DEP in ${DEPLOYMENTS}
    do
      # if the deployment is idled, unidle it :)
      DEP_JSON=$($OC get ${DEP} -o json)
      if [ $(echo "$DEP_JSON" | jq -r '.status.replicas // 0') == "0" ]; then
        REPLICAS=$(echo "$DEP_JSON" | jq -r '.metadata.annotations."idling.amazee.io/unidle-replicas" // 1')
        if [ ! -z "$REPLICAS" ]; then
          REPLICAS=1
        fi
        echo "${UUID}: Attempting to scale deployment='${DEP}' for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
        $OC scale --replicas=${REPLICAS} ${DEP} >/dev/null 2>&1
      fi
    done
    # then if we have to wait for them to start, do that here
    for DEP in ${DEPLOYMENTS}
    do
      # for unidling an entire environment and waiting for the number of `readyReplicas`
      # to be 1 for each deployment, could add considerable delays for the ssh connection to establish.
      # WAIT_TO_UNIDLE_SERVICES will default to false so that it just scales the deployments
      # and won't wait for them to be ready, but if set to true, it will wait for `readyReplicas` to be 1
      if [[ "$WAIT_TO_UNIDLE_SERVICES" =~ [Tt][Rr][Uu][Ee] ]]; then
        echo "${UUID}: Environment is idled waiting for scale up for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
        SSH_CHECK_COUNTER=0
        until [[ $($OC get ${DEP} -o json | jq -r '.status.readyReplicas // 0') -ne "0" ]]
        do
          if [ $SSH_CHECK_COUNTER -lt $SSH_CHECK_TIMEOUT ]; then
            let SSH_CHECK_COUNTER=SSH_CHECK_COUNTER+1
            sleep 5
          else
            echo "${UUID}: Deployment '${DEP}' took too long to start pods"
            exit 1
          fi
        done
        echo "${UUID}: Environment scaled up for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
      fi
    done
  fi
  # then actually unidle the service that was requested and wait for it to be ready if it wasn't already captured above
  # doing this means if the service hasn't been idled with the `idling.amazee.io/watch=true` label
  # we can still establish a connection
  DEPLOYMENT=$($OC get deployment -l "lagoon.sh/service=${SERVICE}" -o name)
  # If the deployment is scaled to 0, scale to 1
  # .status.replicas doesn't exist on a scaled to 0 deployment in k8s so assume it is 0 if nothing is returned
  if [[ $($OC get ${DEPLOYMENT} -o json | jq -r '.status.replicas // 0') == "0" ]]; then
    echo "${UUID}: Attempting to scale deployment='${DEPLOYMENT}' for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
    $OC scale --replicas=1 ${DEPLOYMENT} >/dev/null 2>&1
  fi
  # Wait until the scaling is done
  SSH_CHECK_COUNTER=0
  until [[ $($OC get ${DEPLOYMENT} -o json | jq -r '.status.readyReplicas // 0') -ne "0" ]]
  do
    if [ $SSH_CHECK_COUNTER -lt $SSH_CHECK_TIMEOUT ]; then
      let SSH_CHECK_COUNTER=SSH_CHECK_COUNTER+1
      sleep 5
    else
      echo "${UUID}: Pod for ${SERVICE} took too long to start"
      exit 1
    fi
  done
  echo "${UUID}: Deployment is running deployment='${DEPLOYMENT}' for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
fi

# If there is a deploymentconfig for the given service, then it isn't kubernetes, it is openshift.
if [[ "${IS_KUBERNETES}" == "false" ]]; then
  if [[ $($OC get deploymentconfigs -l service=${SERVICE} 2> /dev/null) ]]; then
    DEPLOYMENTCONFIG=$($OC get deploymentconfigs -l service=${SERVICE} -o name)
    # If the deploymentconfig is scaled to 0, scale to 1
    if [[ $($OC get ${DEPLOYMENTCONFIG} -o go-template --template='{{.status.replicas}}') == "0" ]]; then
      echo "${UUID}: Attempting to scale deploymentconfig='${DEPLOYMENTCONFIG}' for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
      $OC scale --replicas=1 ${DEPLOYMENTCONFIG} >/dev/null 2>&1

      # Wait until the scaling is done
      while [[ ! $($OC get ${DEPLOYMENTCONFIG} -o go-template --template='{{.status.readyReplicas}}') == "1" ]]
      do
        sleep 1
      done
    fi
    echo "${UUID}: Deployment is running deploymentconfig='${DEPLOYMENTCONFIG}' for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
  fi
fi

# Check for newer Helm chart "lagoon.sh" labels
echo "${UUID}: Getting pod name for exec for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
if [[ "${IS_KUBERNETES}" == "true" ]]; then
  POD=$($OC get pods -l "lagoon.sh/service=${SERVICE}" -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')
else
  POD=$($OC get pods -l service=${SERVICE} -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')
fi

if [[ ! $POD ]]; then
  echo "${UUID}: No running pod found for service ${SERVICE}"
  exit 1
fi

# If no container defined, load the name of the first container
if [[ -z ${CONTAINER} ]]; then
  CONTAINER=$($OC get pod ${POD} -o json | jq --raw-output '.spec.containers[0].name')
fi

if [ -t 1 ]; then
  TTY_PARAMETER="-t"
else
  TTY_PARAMETER=""
fi

echo "${UUID}: Exec to pod='${POD}' for project='${PROJECT}' cluster='${CLUSTER_NAME}' service='${SERVICE}'"  >> /proc/1/fd/1
if [[ -z "$*" ]]; then
  exec $OC exec ${POD} -c ${CONTAINER} -i ${TTY_PARAMETER} -- sh
else
  exec $OC exec ${POD} -c ${CONTAINER} -i ${TTY_PARAMETER} -- sh -c "$*"
fi
