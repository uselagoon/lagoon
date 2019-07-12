#!/bin/bash
#
# Author: Vincenzo De Naro Papa
# Email: vincenzo.denaropapa@amazee.io
#
# Description: Run a Lagoon old environments cleanup based on closed GitHub's PRs
# Usage: ./lagoonenvclean customer number_of_months yes|no 
#
# Example: ./lagoonenvclean rasch 3 yes 
# Above command, will revome all environments, older than 3 months, in all customer's projects, related to closed PRs on GitHub.


# Script accepts 3 arguments (1 mandatory):
#
# CUSTOMER to query
# MONTHS to calculate the time slot
# DRYRUN to execute or not the deletion of the environments


CUSTOMER="$1"
MONTHS="${2:-2}"
DRYRUN="${3:-false}"


# CLEANDATE: environments older than that date will be remove if related to a closed PR
# ENDPOINT: Lagoon API endpoint to query
# GHENDPOINT: GitHub API endpoint
# AMZBEARERTKN: Lagoon API token
# GHUTKN: GitHub API Authentication token

CLEANDATE=$(date +%Y%m%d -d "-$MONTHS months")
ENDPOINT="https://api-lagoon-master.lagoon.ch.amazee.io/graphql"
GHENDPOINT="https://api.github.com"
AMZTKN=""
AMZBEARERTKN="Authorization: bearer $AMZTKN"
GHTKN="513e8a43bbb052da3bffdddc01e32142671e1f28"
GHBEARERTKN="Authorization: bearer $GHTKN"

# Some basic Lagoon GraphQL queries:
#
# QLPROJECTQUERY: GraphQL query to retrieve all projects belonging to a customer
# PROJECTQUERYi: one-line and escaped query to retrieve projects of a customer
# QLENVSQUERY: GraphQL query to retrieve, for each project, all the environments
# QLENVQUERY: GraphQL query to retrieve information on a single environment per project
# QLENVDELETE: GraphQL mutation to delete the environment

QLPROJECTQUERY="query allcustomerproject { customerByName (name: \"$CUSTOMER\") { projects { name } }}"
PROJECTQUERY=$(echo $QLPROJECTQUERY | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

QLENVSQUERY="query envbyproject { projectByName (name: \"PROJECT\") { gitUrl, id, environments { name, openshiftProjectName } }}"

QLENVQUERY="query envbyname { environmentByName (name: NAME, project: ID) { updated }}"

QLENVDELETE="mutation delenv { deleteEnvironment(input: {name: ENV, project: PROJECT, execute: BOOLEAN})}"

# Function to retrieve customer's projects
allproject_query() {
	PROJECTS=`curl -s -k -X POST -H 'Content-Type: application/json' -H "$AMZBEARERTKN" $ENDPOINT -d "{\"query\": \"$PROJECTQUERY\"}" | jq -r '.[].customerByName.projects[].name'`
}

#Function to retrieve environments per project
allenvironment_query() {
	echo "Lagoon $1 project"

	# Substitute variables and escape characters in the query
	ENVQUERY=$(echo $QLENVSQUERY | sed "s/PROJECT/$1/g" | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

	# Run the query
	RESULT=`curl -s -k -X POST -H 'Content-Type: application/json' -H "$AMZBEARERTKN" $ENDPOINT -d "{\"query\": \"$ENVQUERY\"}"`

	# From the results, take only environemnts called with a "pr-" to identify Pull Requests
	ENVS=`echo $RESULT | jq -r '.[].projectByName.environments[].name'|grep -E -i "^(pr-)"`

	# Retrieve the GitURL
	GITURL=`echo $RESULT | jq -r '.[].projectByName.gitUrl'`

	# Retrieve GitHub project and owner by the git url
	GITPROJECT=`echo ${GITURL%%.git}|cut -f 2 -d "/"`
	GITOWNER=`echo $GITURL | cut -f2 -d ":"|cut -f1 -d "/"`
	
	# Retrieve Lagoon project ID and Openshift name of the project
	PROJECTID=`echo $RESULT | jq -r '.[].projectByName.id'`
	OCPROJECT=`echo $RESULT | jq -r '.[].projectByName.environments[].openshiftProjectName'`

	# Create a global associative array (it simulates a multi-dimensional array) where to store some variables per project
	declare -gA LAGOONENVS
	LAGOONENVS[$1,id]="$PROJECTID"
	LAGOONENVS[$1,gitproject]="$GITPROJECT"
	LAGOONENVS[$1,ocproject]="$OCPROJECT"
	LAGOONENVS[$1,envs]="$ENVS"
}

# Function to retrieve information about single project's environment
environment_query() {
	
	# Escape environment name
	ENVCLEAN=$(echo $1 | sed -e "s#/#\\\/#g")

	# Substitute and escape characters in GraphQL query
	ONEENVQUERY=$(echo $QLENVQUERY | sed "s/NAME/\"$ENVCLEAN\"/g" | sed "s/ID/$2/g" | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

	# Run the query and store results into a variable
	ONERESULT=`curl -s -k -X POST -H 'Content-Type: application/json' -H "$AMZBEARERTKN" $ENDPOINT -d "{\"query\": \"$ONEENVQUERY\"}"`

	# Set variable with the last update of an environment, in a YYYYMMDD format
	UPDATEDATE=`echo "$ONERESULT" | jq -r '.[].environmentByName.updated' | cut -f1 -d " "| xargs date +%Y%m%d -d`

	# Declare a "fake" multi-demensional array, where to store variable per project and per environment
	declare -gA LAGOONENV
	LAGOONENV[$i,$1]="$UPDATEDATE"
	#echo "Project $i, env $1, last update ${LAGOONENV[$i,$1]}"
}


# Function to delete Lagoon project's environment
lagoonenv_clean() {

	# Substitue and escape characters in GraphQL query
	ENVDELETE=$(echo $QLENVDELETE | sed "s/ENV/\"$1\"/g" | sed "s/PROJECT/\"$2\"/g" | sed "s/BOOLEAN/\"$3\"/g" | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')
	if [ "$3" = "false" ]; then
		echo "Dry-run env delete"
		echo $ENVDELETE
	else
		echo "Deleting the $1 env of $2 project"
		echo $ENVDELETE
	fi
}

# Function to query GitHub PR's status
ghpr_query() {

	# Retrieve the status of a PR
	GHPRSTATE=$(curl -s -k -H "$GHBEARERTKN" $GHENDPOINT/repos/$1/$2/pulls/$3|jq -r .state)

	# Retrieve the lastupdate time of a PR
	GHPRUPDATE=$(curl -s -k -H "$GHBEARERTKN" $GHENDPOINT/repos/$1/$2/pulls/$3|jq -r .updated_at| xargs date +%Y%m%d -d)
	echo "PR n$3 is $GHPRSTATE and updated on $GHPRUPDATE"

	# Execute the clean function *only* if the PR is closed and the lagoon environment last update time is before last N months.
	if [ "$GHPRSTATE" = "closed" -a $GHPRUPDATE -le $CLEANDATE ]; then
		echo "Delete environment ${env} $DRYRUN"
		lagoonenv_clean $env $i $DRYRUN
	else
		if [ "$GHPRSTATE" = "open" ]; then
			echo "Environment ${env} is not deleted because status"
		else
			echo "Environment ${env} is not deleted because date"
		fi
	fi
}

usage() {
	echo -e "Usage is: ./lagoonenvclean.sh customer number_of_months true|false \nes: ./lagoonenvclean.sh rasch 4 true\n"
	echo "Customer parameter is mandatory!"
	exit 1
}


# Main function
main () {
	if [ -z "$1" ]; then
		usage
	fi
	# Script body
	if [ -z "$AMZTKN" ]; then
		echo "Create a JWT token and set AMZTKN variable"
		exit 1
	fi
	allproject_query $1
	for i in $PROJECTS
	do
		allenvironment_query $i
		for env in ${LAGOONENVS[$i,envs]}
		do
			id=${LAGOONENVS[$i,id]}
			environment_query "$env" $id
			ghpr_query $GITOWNER $GITPROJECT ${env##pr-} 
		done
	done
}

main $1 $2 $3
