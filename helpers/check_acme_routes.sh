#!/bin/bash

# Description: script to check routes with exposer pods.
# In case of no DNS record or mis-configuration, script will update the route
# by disabling the tls-acme, removing other acme related annotations and add
# an interal one for filtering purpose

set -eu -o pipefail

# Set DEBUG variable to true, to start bash in debug mode
DEBUG="${DEBUG:-"false"}"
if [ "$DEBUG" = "true" ]; then
	set -x
fi

# Some variables

# Cluster full hostname and API hostname
CLUSTER_HOSTNAME="${CLUSTER_HOSTNAME:-""}"
CLUSTER_API_HOSTNAME="${CLUSTER_API_HOSTNAME:-"$CLUSTER_HOSTNAME"}"

# Default command
COMMAND=${1:-"help"}

# Set DRYRUN variable to true to run in dry-run mode
DRYRUN="${DRYRUN:-"false"}"


# Set a REGEX variable to filter the execution of the script
REGEX=${REGEX:-".*"}

# Set NOTIFYONLY to true if you want to send customers a notification
# explaining why Lagoon is not able to issue Let'S Encrypt certificate for
# some routes defined in customer's .lagoon.yml file.
# If set to true, no other action rather than notification is done (ie: no annotation or deletion)
NOTIFYONLY=${NOTIFYONLY:-"false"}

# Help function
function usage() {
	echo -e "The available commands are:
		- help (get this help)
		- getpendingroutes (get a list of routes with acme \"orderStatus\" in Pending
		- getdisabledroutes (get a list of routes with \"administratively-disabled\" annotation
		- getbrokenroutes (get a list of all possible broken routes)
		- updateroutes (update broken routes)

		By default, script doesn't set any default cluster to run routes' checks. Please set CLUSTER_HOSTNAME and CLUSTER_API_HOSTNAME variables.
		If you want to change the API endpoint, set CLUSTER_API_HOSTNAME variable.
		If you want to change the cluster's hostname, set CLUSTER_HOSTNAME variable.
		If you want to filter the execution of the script only for certain projects, set the REGEX variable.
		If you want to test against a specific IP, set the CLUSTER_IPS array.

		Examples:
		CLUSTER_HOSTNAME=\"ch.amazee.io\" CLUSTER_API_HOSTNAME=\"ch.amazeeio.cloud\" ./check_acme_routes.sh getpendingroutes (Returns a list of all routes witl TLS in Pending status for the defined cluster)
		REGEX=\"drupal-example\" ./check_acme_routes.sh getpendingroutes (Returns a list of all routes for all projects matchiing the regex \`drupal-example\` with TLS in Pending status)
		REGEX=\"drupal-example-main\" DRYRUN=true ./check_acme_routes.sh updateroutes (Will run in DRYRUN mode to check and update all broken routes in \`drupal-example-main\` project)"

}

# Function that performs mandatory variales and dependencies checks
function initial_checks() {
	# By default script doesn't set CLUSTER_HOSTNAME and CLUSTER_API_HOSTNAME. At least CLUSTER_HOSTNAME must be set
	if [ -z "$CLUSTER_HOSTNAME" ]; then
		echo "Please set CLUSTER_HOSTNAME variable"
		usage
		exit 1
	fi

	# Script depends on `lagoon-cli`. Check if it in installed
	if [[ ! $(command -v lagoon) ]]; then
		echo "Please install \`lagoon-cli\` from https://github.com/amazeeio/lagoon-cli because the script relys on it"
		exit 1
	fi
}

# function to get a list of all "administratively-disabled" routes
function get_all_disabled_routes() {
	echo -e "List of routes administratively disabled\n"
	oc get route --all-namespaces -o=jsonpath="{range .items[?(@.metadata.annotations.amazee\.io/administratively-disabled)]}{.metadata.namespace}{'\t'}{.metadata.name}{'\n'}{end}"
	exit 0
}

# Function to check if you are running the script on the right cluster and if you're logged in correctly
function check_cluster_api() {
	# Check on which cluster you're going to run commands
	if oc whoami --show-server | grep -q -v "$CLUSTER_API_HOSTNAME"; then
		echo "Please connect to the right cluster"
		exit 1
	fi

	# Check if you're logged in correctly
	if [ $(oc status|grep -q "Unauthorized";echo $?) -eq 0 ]; then
		echo "Please login into the cluster"
		exit 1
	fi
}

# Function to get a list of all routes with acme.openshift.io/status.provisioningStatus.orderStatus=pending
function get_pending_routes() {
	for namespace in $(oc get projects --no-headers=true |awk '{print $1}'|sort -u|grep -E "$REGEX")
	do
		IFS=$';'
		# For each route in a namespace with `tls-acme` set to true, check the `orderStatus` if in pending status
		for routelist in $(oc get route -n "$namespace" -o=jsonpath="{range .items[?(@.metadata.annotations.kubernetes\.io/tls-acme=='true')]}{.metadata.name}{'\n'}{.metadata.annotations.acme\.openshift\.io/status}{';'}{end}"|sed "s/^[[:space:]]*//")
		do
			PENDING_ROUTE_NAME=$(echo "$routelist"|sed -n 1p)
			if echo "$routelist"|sed -n 4p | grep -q pending; then
				STATUS="Pending"
				echo "Route $PENDING_ROUTE_NAME in $namespace is in $STATUS status"
			fi

		done
		unset IFS
	done
}

# Function for creating an array with all routes that might be updated
function create_routes_array() {
	# Get the list of namespaces with broker routes, according to REGEX
	for namespace in $(oc get routes --all-namespaces|grep exposer|awk '{print $1}'|sort -u|grep -E "$REGEX")
	do
		# Raw JSON Openshift project output
		PROJECTJSON="$(oc get project "$namespace" -o json)"

		# Gather project name based on a label or an annotation
		if [ $(echo $PROJECTJSON |grep -q 'lagoon.sh/project'; echo $?) -eq 0 ]; then
			PROJECTNAME=$(echo "${PROJECTJSON}" | grep 'lagoon.sh/project' | awk -F'"' '{print $4}')
		else
			PROJECTNAME=$(echo "${PROJECTJSON}" |grep display-name|awk -F'[][]' '{print $2}'|tr "_" "-")
		fi

		# Get the list of broken unique routes for each namespace
		for routelist in $(oc get -n "$namespace" route|grep exposer|awk -vNAMESPACE="$namespace" -vPROJECTNAME="$PROJECTNAME" '{print $1";"$2";"NAMESPACE";"PROJECTNAME}'|sort -u -k2 -t ";")
		do
			# Put the list into an array
			ROUTES_ARRAY+=("$routelist")
		done
	done

	# Create a sorted array of unique route to check
	ROUTES_ARRAY_SORTED=($(sort -u -k 2 -t ";"<<<"${ROUTES_ARRAY[*]}"))
}

# Function to check the routes, update them and delete the exposer's routes
function check_routes() {

	# Cluster array of IPs
	CLUSTER_IPS=($(dig +short "$CLUSTER_HOSTNAME"))
	for i in "${ROUTES_ARRAY_SORTED[@]}"
	do
		# Tranform the item into an array
		route=($(echo "$i" | tr ";" "\n"))

		# Gather some useful variables
		ROUTE_NAME=${route[0]}
		ROUTE_HOSTNAME=${route[1]}
		ROUTE_NAMESPACE=${route[2]}
		ROUTE_PROJECTNAME=${route[3]}

		# Get route DNS record(s)
		if [[ $(dig +short "$ROUTE_HOSTNAME" &> /dev/null; echo $?) -ne 0 ]]; then
			ROUTE_HOSTNAME_IP="null"
		else
			ROUTE_HOSTNAME_IP=$(dig +short "$ROUTE_HOSTNAME")
		fi

		# Check if the route matches the Cluster's IP(s)
		if echo "$ROUTE_HOSTNAME_IP" | grep -E -q -v "${CLUSTER_IPS[*]}"; then

			# If IP is empty, then no DNS record set
			if [ -z "$ROUTE_HOSTNAME_IP" ]; then
				DNS_ERROR="No A or CNAME record set"
			else
				DNS_ERROR="$ROUTE_HOSTNAME in $ROUTE_NAMESPACE has no DNS record pointing to ${CLUSTER_IPS[*]} therefore we have temporarily disabled the tls-acme process"
			fi

			# Print the error on stdout
			echo "$DNS_ERROR"

			if [[ "$NOTIFYONLY" = "true" ]]; then
				notify_customer "$ROUTE_PROJECTNAME"
			else
				# Call the update function to update the route
				update_annotation "$ROUTE_HOSTNAME" "$ROUTE_NAMESPACE"
				notify_customer "$ROUTE_PROJECTNAME"

				# Now once the main route is updated, it's time to get rid of exposers' routes
				for j in $(oc get -n "$ROUTE_NAMESPACE" route|grep exposer|grep -E '(^|\s)'"$ROUTE_HOSTNAME"'($|\s)'|awk '{print $1";"$2}')
				do
					ocroute=($(echo "$j" | tr ";" "\n"))
					OCROUTE_NAME=${ocroute[0]}
					if [[ $DRYRUN = true ]]; then
						echo -e "DRYRUN oc delete -n $ROUTE_NAMESPACE route $OCROUTE_NAME"
					else
						echo -e "\nDelete route $OCROUTE_NAME"
						oc delete -n "$ROUTE_NAMESPACE" route "$OCROUTE_NAME"
					fi
				done
			fi
		fi
		echo -e "\n"


	done
}

# Function to update route's annotation (ie: update tls-amce, remove tls-acme-awaiting-* and set a new one for internal purpose)
function update_annotation() {
	echo "Update route's annotations"
	OCOPTIONS="--overwrite"
	if [[ "$DRYRUN" = "true" ]]; then
		OCOPTIONS="--dry-run --overwrite"
	fi

	# Annotate the route
	oc annotate -n "$2" $OCOPTIONS route "$1" acme.openshift.io/status- kubernetes.io/tls-acme-awaiting-authorization-owner- kubernetes.io/tls-acme-awaiting-authorization-at-url- kubernetes.io/tls-acme="false" amazee.io/administratively-disabled="$(date +%s)"
}


# Function to notify customer about the misconfiguration of their routes
function notify_customer() {

	# Get Slack|Rocketchat channel and webhook
	if [ $(TEST=$(lagoon list slack -p "$1" --no-header|awk '{print $3";"$4}'); echo $?) -eq 0 ]; then
		NOTIFICATION="slack"
	elif [ $(TEST=$(lagoon list rocketchat -p "$1" --no-header|awk '{print $3";"$4}'); echo $?) -eq 0 ]; then
		NOTIFICATION="rocketchat"
	else
		echo "No notification set"
		return 0
	fi

	MESSAGE="The $ROUTE_HOSTNAME route is configured in the \`.lagoon.yml\` file to issue a TLS certificate from Let's Encrypt. Unfortunately Lagoon is unable to issue a certificate as $DNS_ERROR.\n\nTo fix this issue, the DNS records for $ROUTE_HOSTNAME should point to $CLUSTER_HOSTNAME with a CNAME record (preferred) to your provided Lagoon region or \"A record(s)\" to ${CLUSTER_IPS[*]} (tolerable).\n\nIf you don't need the SSL certificate or you are using a CDN that provides you with a TLS certificate, please update your .lagoon.yml file by setting the tls-acme parameter to false for $ROUTE_HOSTNAME, as described here:  https://docs.lagoon.sh/using-lagoon-the-basics/lagoon-yml#ssl-configuration-tls-acme.\n\nWe have now administratively disabled the issuing of the Let's Encrypt certificate for $ROUTE_HOSTNAME in order to protect the cluster. However this will be reset during the next deployment, therefore we suggest that you resolve this issue as soon as possible. Feel free to reach out to us for further information.\n\nThank you,\nthe amazee.io team"

	NOTIFICATION_DATA=($(lagoon list $NOTIFICATION -p "$1" --no-header|awk '{print $3";"$4}'))
	for notification in ${NOTIFICATION_DATA[@]}
	do
		CHANNEL=$(echo "$notification"|cut -f1 -d ";")
		WEBHOOK=$(echo "$notification"|cut -f2 -d ";")

		# json Payload
		PAYLOAD="\"channel\": \"$CHANNEL\", \"text\": \"${MESSAGE}\""

		echo -e "Sending notification into ${CHANNEL}"

		# Execute curl to send message into the channel
		if [[ $DRYRUN = true ]]; then
			echo "DRYRUN Sending notification on \"$NOTIFICATION\" curl -X POST -H 'Content-type: application/json' --data '{'"$PAYLOAD"'}' "$WEBHOOK""
		else
			curl -X POST -H 'Content-type: application/json' --data '{'"${PAYLOAD}"'}' ${WEBHOOK}
		fi
	done
}

# Main function
function main() {

	COMMAND="$1"

	# Check first the cluster you're connected to
	echo -e "You're running the script on $CLUSTER_HOSTNAME\nDRYRUN mode is set to \"$DRYRUN\""
	check_cluster_api

	case "$COMMAND" in
		help)
			usage
			;;
		getpendingroutes)
			get_pending_routes
			;;
		getdisabledroutes)
			get_all_disabled_routes
			;;
		getbrokenroutes)
			echo -e "\nCreating a list of possible broken routes"
			create_routes_array
			echo -e "ROUTE_NAMESPACE;ROUTE_NAME;ROUTE_HOSTNAME"|column -t -s ";"
			for i in "${ROUTES_ARRAY_SORTED[@]}"
			do
				# Tranform the item into an array
				route=($(echo "$i" | tr ";" "\n"))
				# Gather some useful variables
				ROUTE_NAME=${route[0]}
				ROUTE_HOSTNAME=${route[1]}
				ROUTE_NAMESPACE=${route[2]}
				echo -e "$ROUTE_NAMESPACE;$ROUTE_NAME;$ROUTE_HOSTNAME"|column -t -s ";"
			done
			;;
		updateroutes)
			echo -e "Checking routes\n"
			create_routes_array
			check_routes
			;;
		*)
			usage
			;;
	esac
}

initial_checks "$COMMAND"
main "$COMMAND"
