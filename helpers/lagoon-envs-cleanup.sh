#!/bin/bash
#
# Author: Vincenzo De Naro Papa
# Email: vincenzo.denaropapa@amazee.io
#
# Description: Scripts to cleanup Lagoon environments related to closed/old PRs.
# Usage: LAGOON_API_TOKEN="xxxx" GITHUB_API_TOKEN="xxxx" GITLAB_API_TOKEN="xxxx" ./lagoonenvclean [-g group ] [-p all|project1,project2,...projectn] [-m number_of_months] [-d]
#
# Example: LAGOON_API_TOKEN="xxxx" GITHUB_API_TOKEN="xxxx" GITLAB_API_TOKEN="xxxx" ./lagoonenvclean -g amazeeio -m 3 -p drupal-example
# Will revome drupal-example's environments older than 3 months related to closed PRs.

# Script options are:
#
# -g GROUP (MANDATORY Lagoon group to query)
# -m MONTHS (OPTIONAL number of months since starting the cleanup. Default is 0)
# -p PROJECTS (OPTIONAL comma separated list of projects. Default is "all")
# -d DRYRUN (OPTIONAL check to run the script in dry-run mode)

GROUP=""
DRYRUN="false"
PROJECT="all"
MONTHS=0

# LAGOON_ENDPOINT: Lagoon API endpoint
# GITHUB_ENDPOINT: GitHub API endpoint
# GITLAB_ENDPOINT: Gitlab API endpoint
# LAGOON_API_TOKEN: Lagoon API token
# GITHUB_API_TOKEN: GitHub API Authentication token
# GITLAB_API_TOKEN: Gitlab API Authentication token

LAGOON_ENDPOINT="https://api-lagoon-master.lagoon.ch.amazee.io/graphql"
LAGOON_BEARER_TOKEN="Authorization: bearer $LAGOON_API_TOKEN"

GITHUB_ENDPOINT="https://api.github.com"
# GH Token must have at least `repo Full control of private repositories` scope
GITHUB_BEARER_TOKEN="Authorization: bearer $GITHUB_API_TOKEN"

GITLAB_ENDPOINT="https://gitlab.com/api/v4"
# GL Token must have at least `api read and read repository` scope
GITLAB_BEARER_TOKEN="Authorization: bearer $GITLAB_API_TOKEN"

# Some basic Lagoon GraphQL queries:
#
# QL_ENVS_QUERY: Query to retrieve, for each project, all the environments
# QL_ENV_QUERY: Query to retrieve environment's information per project
# QL_ENV_DELETE: GraphQL mutation to delete the environment


QL_ENVS_QUERY="query envbyproject { projectByName (name: \"PROJECT\") { gitUrl, id, environments { name, openshiftProjectName, deployType } }}"
QL_ENV_QUERY="query envbyname { environmentByName (name: NAME, project: ID) { updated }}"
QL_ENV_DELETE_QUERY="mutation delenv { deleteEnvironment(input: {name: ENV, project: PROJECT})}"

# Set `date` command to gdate or date according to Mac/Linux

gnudate() {
	if hash gdate 2> /dev/null; then
		gdate +%Y%m%d -d "$@" 
	else
		date +%Y%m%d -d "$@"
	fi
}

export -f gnudate

# CLEANDATE: environments older will be remove if related to a closed PR
CLEAN_DATE=$(gnudate "-$MONTHS months")

# Function to retrieve group's projects
lagoon_allproject_query() {
	
	# QL_PROJECTS_QUERY: GraphQL query to retrieve all projects belonging to a group
	QL_PROJECTS_QUERY="query allprojectbygroup { allProjectsInGroup (input: {name: \"$GROUP\"}) { name } } "

	# PROJECT_QUERY: one-line and escaped query to retrieve projects of a group 
	PROJECTS_QUERY=$(echo $QL_PROJECTS_QUERY | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $0} else {printf "\\n"$0}}')

	# Variable with all group's projects
	PROJECTS=$(curl -s -k -X POST -H 'Content-Type: application/json' -H "$LAGOON_BEARER_TOKEN" $LAGOON_ENDPOINT -d "{\"query\": \"$PROJECTS_QUERY\"}" | jq -r '.data.allProjectsInGroup[].name'|grep -wv null)

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

	if [ -z "$ENVS" ]; then
		echo "No PR envs"
	fi

	# Retrieve the GitURL
	GIT_URL=$(echo $RESULT | jq -r '.[].projectByName.gitUrl')
	
	if [ $(echo $GIT_URL|grep -q github; echo $?) -eq 0 ]; then
		GIT_SERVER_TYPE="github"
	elif [ $(echo $GIT_URL|grep -q gitlab; echo $?) -eq 0 ]; then
		GIT_SERVER_TYPE="gitlab"
	else
		echo "Git server not supported"
		return
	fi

	# Retrieve GitHub project and owner by the git url
	GIT_PROJECT=$(echo ${GIT_URL%%.git}|cut -f 2 -d "/")
	GIT_OWNER=$(echo $GIT_URL | cut -f2 -d ":"|cut -f1 -d "/")
	
	# Retrieve Lagoon project ID and Openshift name of the project
	PROJECT_ID=$(echo $RESULT | jq -r '.[].projectByName.id')
	OC_PROJECT=$(echo $RESULT | jq -r '.[].projectByName.environments[].openshiftProjectName')

	# Create a global associative array to store some variables per project
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
	if [ "$DRYRUN" = "true" ]; then
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
	
	# Retrieve the status of a PR
	GITHUB_PR_STATUS=$(curl -s -k -H "$GITHUB_BEARER_TOKEN" $GITHUB_ENDPOINT/repos/$1/$2/pulls/$3|jq -r .state)

	# Retrieve the lastupdate time of a PR
	GITHUB_PR_UPDATE=$(curl -s -k -H "$GITHUB_BEARER_TOKEN" $GITHUB_ENDPOINT/repos/$1/$2/pulls/$3|jq -r .updated_at| xargs -I {} bash -c "gnudate {}")
	echo "PR $3 is $GITHUB_PR_STATUS and updated on $GITHUB_PR_UPDATE"

	# Invoke clean function *only* if the PR is closed and last update date is before N months.
	if [ "$GITHUB_PR_STATUS" = "closed" -a $GITHUB_PR_UPDATE -le $CLEAN_DATE ]; then
		echo "Delete environment ${env} true"
		lagoon_environment_clean $env $i true
	else
		if [ "$GITHUB_PR_STATUS" = "open" ]; then
			echo "Environment ${env} is not deleted because status"
		else
			echo "Environment ${env} is not deleted because date"
		fi
	fi
}

# Function to query Gitlab PR's status
gitlab_pr_query_delete() {
	
	# Retrieve project's ID
	GITLAB_PROJECT_ID=$(curl -s -k -H "$GITLAB_BEARER_TOKEN" $GITLAB_ENDPOINT/projects/$1%2F$2 | jq -r .id)

	# Retrieve PR's iid
	GITLAB_PR_IID=$(curl -s -k -H "$GITLAB_BEARER_TOKEN" $GITLAB_ENDPOINT/projects/$1%2F$2/merge_requests?view=simple |jq -r ".[] | select(.id == $3)|.iid")

	# Retrieve the status of a PR
	GITLAB_PR_STATUS=$(curl -s -k -H "$GITLAB_BEARER_TOKEN" $GITLAB_ENDPOINT/projects/$1%2F$2/merge_requests/$GITLAB_PR_IID |jq -r .state)

	# Retrieve the lastupdate time of a PR
	GITLAB_PR_UPDATE=$(curl -s -k -H "$GITLAB_BEARER_TOKEN" $GITLAB_ENDPOINT/projects/$1%2F$2/merge_requests/$GITLAB_PR_IID|jq -r .updated_at| xargs -I {} bash -c "gnudate {}")
	echo "PR $3 is $GITLAB_PR_STATUS and updated on $GITLAB_PR_UPDATE"

	# Invoke clean function *only* if the PR is closed and last update date is before N months.
	if [ "$GITLAB_PR_STATUS" = "closed" -a $GITLAB_PR_UPDATE -le $CLEAN_DATE ]; then
		echo "Delete environment ${env} true"
		lagoon_environment_clean $env $i true
	else
		if [ "$GITLAB_PR_STATUS" = "open" ]; then
			echo "Environment ${env} is not deleted because status"
		else
			echo "Environment ${env} is not deleted because date"
		fi
	fi
}


usage() {
	echo -e "Usage is: $0 [-c group] [-m number_of_months] [-p all|project1,project2,...,projectN] [-d] \nes: $0 -c amazeeio -m 4 -d true\n"
	echo "Script options are:
	-g GROUP (MANDATORY Lagoon group to query)
 	-m MONTHS (OPTIONAL number of months since starting the cleanup. Default is 0)
 	-p PROJECTS (OPTIONAL comma separated list of projects to look for closed PRs to cleanup. Default is "all")
 	-d DRYRUN (OPTIONAL check to run the script in dry-run mode to see what is going to be cleaned. Default is "false")"
	exit 1
}


# Main function
main () {
	while getopts "hg:m:p:d" opt
	do
		case "${opt}" in
			h)
				usage
				;;
			g)
				GROUP="${OPTARG}"
				;;
			m)
				MONTHS="${OPTARG:-0}"
				;;
			d)
				# By default DRYRUN is set to false
				DRYRUN="true"
				;;
			p)	
				# Possible to specify single group's project to query
				PROJECT="${OPTARG:-all}"
				;;
			*)
				usage
				;;
		esac
	done

	if [ -z "$GROUP" ]; then
		echo -e "Group is MANDATORY\n"
		usage
	fi

	if [ -z "$LAGOON_API_TOKEN" -o -z "$GITHUB_API_TOKEN" -a -z "$GITLAB_API_TOKEN" ]; then
		echo "Lagoon JWT token or Github Token are not set"
		exit 1
	fi

	# Script body
	if [ "$PROJECT" = "all" ]; then
		lagoon_allproject_query $GROUP
	else
		PROJECTS=$PROJECT
	fi

	for i in ${PROJECTS//,/ }
	do
		lagoon_allenvironment_query $i
		for env in ${LAGOON_ENVS[$i,envs]}
		do
			id=${LAGOON_ENVS[$i,id]}
			if [ "$GIT_SERVER_TYPE" = "github" ]; then
				echo "Git is github"
				github_pr_query_delete $GIT_OWNER $GIT_PROJECT ${env##pr-}
			elif [ "$GIT_SERVER_TYPE" = "gitlab" ]; then
				echo "Git is gitlab"
				gitlab_pr_query_delete $GIT_OWNER $GIT_PROJECT ${env##pr-}
			else
				echo "Not supported git"
			fi
		unset IFS
		done
	done
}

main $@ 
