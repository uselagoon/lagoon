#!/bin/bash
set -euo pipefail

function usage {

cat << EOF
1. Test that the host of a Helm release is contactable from outside the cluster.  
2. Test that a service for a Helm release is contactable within the cluster.

pre-reqs:

The Python module 'yq' must be installed.

usage: 
    ./test-host.sh -r <release_name> -h <host_path> -s <service_name> -p <service_port>

arguments:
    -r <release_name>, --release-name=<release_name>   is the Helm release name to test.
    -h <host_path>   , --host-path=<host_path>         is the host path within the Helm release values.
    -s <service_name>, --service-name=<service_name>   is the service name to test.
    -p <service_port>, --service-port=<service_port>   is the service port to test.

example:
    ./test-host.sh -r prometheus-dpc -h ".server.ingress.hosts[0]" -s prometheus-dpc-prometheus-dpc-server -p 80

EOF

exit 1
}


function checkArgHasValue {
    if [[ $# == 1 ]]; then
        echo "ERROR: You must set a value for the $1 argument"
        echo
        usage
    fi
}


function missingValue {
    echo "ERROR: You must set a value for <$1>"
    echo
    usage
}


function error {
    echo "ERROR: $1"
    echo
    exit 1
}

#
# MAIN
#

# Initialise variables
RELEASE_NAME=""
HOST_PATH=""
SERVICE_NAME=""
SERVICE_PORT=""


# Check that the Python yq module is installed
PIP_YQ=`pip list installed 2>/dev/null | grep yq || true`
[ "$PIP_YQ" == "" ] && error "Python module 'yq' must be installed."


# Parse the command line arguments
[ $# = 0 ] && usage $0 
while [ "$#" -gt 0 ]
do
    case $1 in
        -r|--release-name=* )
            [ ${#1} -eq 2 ] && checkArgHasValue $* && RELEASE_NAME=$2 && shift 
            [ ${#1} -gt 2 ] && RELEASE_NAME="${1#*=}" 
            ;;
        
        -h|--host-path=* )
            [ ${#1} -eq 2 ] && checkArgHasValue $* && HOST_PATH=$2 && shift
            [ ${#1} -gt 2 ] && HOST_PATH="${1#*=}"
            ;;

        -s|--service-name=* )
            [ ${#1} -eq 2 ] && checkArgHasValue $* && SERVICE_NAME=$2 && shift
            [ ${#1} -gt 2 ] && SERVICE_NAME="${1#*=}"
            ;;

        -p|--service-port=* )
            [ ${#1} -eq 2 ] && checkArgHasValue $* && SERVICE_PORT=$2 && shift
            [ ${#1} -gt 2 ] && SERVICE_PORT="${1#*=}"
            ;;
                    
        * )
            echo "ERROR: Unknown argument: $1"
            echo
            usage
            
    esac    
    [ $# != 0 ] && shift
done


# Confirm all variables have been set
[ "$RELEASE_NAME" == "" ] && missingValue release_name
[ "$HOST_PATH" == "" ]    && missingValue host_path
[ "$SERVICE_NAME" == "" ] && missingValue service_name
[ "$SERVICE_PORT" == "" ] && missingValue service_port


# Get host from the Helm release
HOST=`helm get values $RELEASE_NAME | yq $HOST_PATH | sed s/\"//g`
[ "$HOST" == "null" ] && error "Unable to get a host value.  Check <host_path> is correct."
echo "Found the following host:       $HOST"

# Get the Namespace for the Helm release
NAMESPACE=`helm ls $RELEASE_NAME | awk 'FNR == 2 { print $NF }'`
echo "Found the following NameSpace:  $NAMESPACE"

# Get the response code from the host
RESPONSE_CODE=`curl -L -o /dev/null -s -w "%{http_code}\n" $HOST`
echo "Host response code:             $RESPONSE_CODE"
[ "$RESPONSE_CODE" != "200" ] && error "Host did not return a '200' response code."

# Get the response code for the service shortname
RESPONSE_CODE=`oc run \
               --attach --rm --restart=Never \
               alpine-curl --image=appropriate/curl \
               --env="SERVICE_NAME=$SERVICE_NAME" \
               --env="SERVICE_PORT=$SERVICE_PORT" \
               --quiet --command -- \
               curl -L -o /dev/null -s -w "%{http_code}\n" ${SERVICE_NAME}:${SERVICE_PORT} \
               || true`
echo "Service response code:          $RESPONSE_CODE"
[ "$RESPONSE_CODE" != "200" ] && error "Service did not return a '200' response code."

exit 0