#!/bin/bash
#
# Author: Vincenzo De Naro Papa
# Email: vincenzo.denaropapa@amazee.io
#
# Description: Cleanup Lagoon project's environments belonging to a closed GitHub's PR.
# Usage: LAGOON_API_TOKEN="xxxx" GITHUB_API_TOKEN="xxxx" ./lagoonenvclean [-c customer] [-p all|project1,project2,...projectn] [-m number_of_months] [-d] 
#
# Example: LAGOON_API_TOKEN="xxxx" GITHUB_API_TOKEN="xxxx" ./lagoonenvclean -c amazeeio -m -d -p drupal-example
# Above command, will revome all environments older than 3 months, in drupal-example customer's project, related to closed PRs on GitHub.

# Script options are:
#
# -c CUSTOMER (MANDATORY Lagoon customer to query)
# -m MONTHS (OPTIONAL number of months since starting the cleanup. Default is 0)
# -p PROJECTS (OPTIONAL comma separated list of projects to look for closed PRs to cleanup. Default is "all")
# -d DRYRUN (OPTIONAL check to run the script in dry-run mode to see what is going to be cleaned. Default is "false")

CUSTOMER=""
DRYRUN="false"
PROJECT="all"

# LAGOON_ENDPOINT: Lagoon API endpoint
# GITHUB_ENDPOINT: GitHub API endpoint
# LAGOON_API_TOKEN: Lagoon API token
# GITHUB_API_TOKEN: GitHub API Authentication token

LAGOON_ENDPOINT="https://api-lagoon-master.lagoon.ch.amazee.io/graphql"
LAGOON_BEARER_TOKEN="Authorization: bearer $LAGOON_API_TOKEN"

GITHUB_ENDPOINT="https://api.github.com"
# GitHub Personal Access token must have at least `repo Full control of private repositories` scope
GITHUB_BEARER_TOKEN="Authorization: bearer $GITHUB_API_TOKEN"

# Some basic Lagoon GraphQL queries:
#
# QL_ENVS_QUERY: GraphQL query to retrieve, for each project, all the environments
# QL_ENV_QUERY: GraphQL query to retrieve information on a single environment per project
# QL_ENV_DELETE: GraphQL mutation to delete the environment


QL_ENVS_QUERY="query envbyproject { projectByName (name: \"PROJECT\") { gitUrl, id, environments { name, openshiftProjectName, deployType } }}"
QL_ENV_QUERY="query envbyname { environmentByName (name: NAME, project: ID) { updated }}"
QL_ENV_DELETE_QUERY="mutation delenv { deleteEnvironment(input: {name: ENV, project: PROJECT, execute: BOOLEAN})}"

# Function to retrieve customer's projects
lagoon_allproject_query() {
	
	# QL_PROJECTS_QUERY: GraphQL query to retrieve all projects belonging to a customer
	QL_PROJECTS_QUERY="query allcustomerproject { customerByName (name: \"$CUSTOMER\") { projects { name } }}"

	# PROJECT_QUERY: one-line and escaped query to retrieve projects of a customer
	PROJECTS_QUERY=$(echo $QL_PROJECTS_QUERY | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

	# Variable with all customer's projects
	PROJECTS=$(curl -s -k -X POST -H 'Content-Type: application/json' -H "$LAGOON_BEARER_TOKEN" $LAGOON_ENDPOINT -d "{\"query\": \"$PROJECTS_QUERY\"}" | jq -r '.[].customerByName.projects[].name')

	# Check if query failed for some reason
	echo "Projects are $PROJECTS"
	if [ -z "$PROJECTS" ]; then
		exit 1
	fi
}

#Function to retrieve environments per project
lagoon_allenvironment_query() {
	echo "Lagoon $1 project"

	# Substitute variables and escape characters in the query
	ENV_QUERY=$(echo $QL_ENVS_QUERY | sed "s/PROJECT/$1/g" | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

	# Run the query
	RESULT=$(curl -s -k -X POST -H 'Content-Type: application/json' -H "$LAGOON_BEARER_TOKEN" $LAGOON_ENDPOINT -d "{\"query\": \"$ENV_QUERY\"}")

	# From the results, take only environemnts identified as PullRequest deploytype
	ENVS=$(echo $RESULT | jq -r '.[].projectByName.environments[] | .name+"_"+.deployType'|grep pullrequest|cut -f 1 -d "_")

	# Retrieve the GitURL
	GIT_URL=$(echo $RESULT | jq -r '.[].projectByName.gitUrl')

	# Retrieve GitHub project and owner by the git url
	GIT_PROJECT=$(echo ${GIT_URL%%.git}|cut -f 2 -d "/")
	GIT_OWNER=$(echo $GIT_URL | cut -f2 -d ":"|cut -f1 -d "/")
	
	# Retrieve Lagoon project ID and Openshift name of the project
	PROJECT_ID=$(echo $RESULT | jq -r '.[].projectByName.id')
	OC_PROJECT=$(echo $RESULT | jq -r '.[].projectByName.environments[].openshiftProjectName')

	# Create a global associative array (it simulates a multi-dimensional array) where to store some variables per project
	declare -gA LAGOON_ENVS
	LAGOON_ENVS[$1,id]="$PROJECT_ID"
	LAGOON_ENVS[$1,gitproject]="$GIT_PROJECT"
	LAGOON_ENVS[$1,ocproject]="$OC_PROJECT"
	LAGOON_ENVS[$1,envs]="$ENVS"
}

# Function to delete Lagoon project's environment
lagoon_environment_clean() {

	# Substitue and escape characters in GraphQL query
	ENV_DELETE_QUERY=$(echo $QL_ENV_DELETE_QUERY | sed "s/ENV/\"$1\"/g" | sed "s/PROJECT/\"$2\"/g" | sed "s/BOOLEAN/$3/g" | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

	# Check for dry-run option
	if [ "$3" = "true" ]; then
		echo "Dry-run delete of the $1 env of $2 project"
		echo $ENV_DELETE_QUERY
	else
		echo "Deleting the $1 env of $2 project"
		echo $ENV_DELETE_QUERY
		ENV_DELETE=$(curl -s -k -X POST -H 'Content-Type: application/json' -H "$LAGOON_BEARER_TOKEN" $LAGOON_ENDPOINT -d "{\"query\": \"$ENV_DELETE_QUERY\"}")
	fi
}

# Function to query GitHub PR's status
github_pr_query_delete() {
	
	# CLEANDATE: environments older than that date will be remove if related to a closed PR
	CLEAN_DATE=$(date +%Y%m%d -d "-$MONTHS months")

	# Retrieve the status of a PR
	GITHUB_PR_STATUS=$(curl -s -k -H "$GITHUB_BEARER_TOKEN" $GITHUB_ENDPOINT/repos/$1/$2/pulls/$3|jq -r .state)

	# Retrieve the lastupdate time of a PR
	GITHUB_PR_UPDATE=$(curl -s -k -H "$GITHUB_BEARER_TOKEN" $GITHUB_ENDPOINT/repos/$1/$2/pulls/$3|jq -r .updated_at| xargs date +%Y%m%d -d)
	echo "PR $3 is $GITHUB_PR_STATUS and updated on $GITHUB_PR_UPDATE"

	# Execute the clean function *only* if the PR is closed and the lagoon environment last update time is before last N months.
	if [ "$GITHUB_PR_STATUS" = "closed" -a $GITHUB_PR_UPDATE -le $CLEAN_DATE ]; then
		echo "Delete environment ${env} $DRYRUN"
		lagoon_environment_clean $env $i $DRYRUN
	else
		if [ "$GITHUB_PR_STATUS" = "open" ]; then
			echo "Environment ${env} is not deleted because status"
		else
			echo "Environment ${env} is not deleted because date"
		fi
	fi
}

usage() {
	echo -e "Usage is: $0 [-c customer] [-m number_of_months] [-p all|project1,project2,...,projectN] [-d] \nes: $0 -c amazeeio -m 4 -d true\n"
	echo "Script options are:
	-c CUSTOMER (MANDATORY Lagoon customer to query)
 	-m MONTHS (OPTIONAL number of months since starting the cleanup. Default is 0)
 	-p PROJECTS (OPTIONAL comma separated list of projects to look for closed PRs to cleanup. Default is "all")
 	-d DRYRUN (OPTIONAL check to run the script in dry-run mode to see what is going to be cleaned. Default is "false")"
	exit 1
}


# Main function
main () {
	while getopts "hc:m:p:d" opt
	do
		case "${opt}" in
			h)
				usage
				;;
			c)
				CUSTOMER="${OPTARG}"
				;;
			m)
				MONTHS="${OPTARG:-0}"
				;;
			d)
				# By default DRYRUN is set to false
				DRYRUN="true"
				;;
			p)	
				# Possible to specify single customer's project to query
				PROJECT="${OPTARG:-all}"
				;;
			*)
				usage
				;;
		esac
	done

	if [ -z "$CUSTOMER" ]; then
		echo -e "Customer is MANDATORY\n"
		usage
	fi

	if [ -z "$LAGOON_API_TOKEN" -o -z "$GITHUB_API_TOKEN" ]; then
		echo "Lagoon JWT token or Github Token are not set"
		exit 1
	fi

	# Script body
	if [ "$PROJECT" = "all" ]; then
		lagoon_allproject_query $CUSTOMER
	else
		PROJECTS=$PROJECT
	fi

	for i in ${PROJECTS//,/ }
	do
		lagoon_allenvironment_query $i
		for env in ${LAGOON_ENVS[$i,envs]}
		do
			id=${LAGOON_ENVS[$i,id]}
			github_pr_query_delete $GIT_OWNER $GIT_PROJECT ${env##pr-} 
			#github_pr_query_delete $GIT_OWNER $GIT_PROJECT ${env} 
		unset IFS
		done
	done
}

main $@ 
