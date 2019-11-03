#!/usr/bin/awk -f

# generate a rule that will pull down all the images that lagoon builds on, and
# write the pulled image name and hashes out to a pull-report.json file.

BEGIN {
	# template used for pull commands
	pullCmdTpl = "\tdocker pull IMAGE | awk '/^Digest/ {digest = $$2} END { print \"{\\\"image\\\":\\\"\" $$0 \"\\\",\\\"repodigest\\\":\\\"\" digest \"\\\"},\"}' >> $$PULL_REPORT_TMP && \\\n"
}

# given a docker image specification and a list of versions, generate the
# docker pull commands
function genPullCmds(imageSpec, versionList)
{
	pullCmds = ""
	# create array of versions
	split(versionList, versions, " ");
	# construct the commands
	for (i in versions) {
		# insert the version into the image spec
		image = imageSpec
		gsub(/\${.+_VERSION.*}/, versions[i], image);
		# append the command to the list
		pullCmd = pullCmdTpl
		sub(/IMAGE/, image, pullCmd)
		pullCmds = pullCmds pullCmd
	}
	return pullCmds
}

# generate multiple versioned pull commands if necessary, otherwise just
# generate a single pull command
$2 ~ /^php/ {
	pullCmdList = pullCmdList genPullCmds($2, PHP_VERSIONS)
	next
}
$2 ~ /^node/ {
	pullCmdList = pullCmdList genPullCmds($2, NODE_VERSIONS)
	next
}
$2 ~ /^python/ {
	pullCmdList = pullCmdList genPullCmds($2, PYTHON_VERSIONS)
	next
}
$2 ~ /^solr/ {
	pullCmdList = pullCmdList genPullCmds($2, SOLR_VERSIONS)
	next
}
$2 ~ /^docker.elastic.co/ {
	pullCmdList = pullCmdList genPullCmds($2, ELASTIC_VERSIONS)
	next
}
$2 ~ /ALPINE_VERSION/ {
	pullCmdList = pullCmdList genPullCmds($2, "$(DEFAULT_ALPINE_VERSION)")
	next
}
$2 ~ /GO_VERSION/ {
	pullCmdList = pullCmdList genPullCmds($2, "$(GO_VERSION)")
	next
}
{
	pullCmd = pullCmdTpl
	sub(/IMAGE/, $2, pullCmd)
	pullCmdList = pullCmdList pullCmd
}

END {
	print "build\:pull: ## Pull all third-party images that Lagoon bases its images on, and write report to pull-report.json"
	print "\tumask 077 && PULL_REPORT_TMP=$$(mktemp) && \\"
	printf pullCmdList | "sort -u"
	print "\tawk 'BEGIN {json = \"[\"} {json = json $$0} END {sub(/,$$/, \"\", json); print json \"]\"}' $$PULL_REPORT_TMP > pull-report.json"
	print ".PHONY: build\:pull"
}
