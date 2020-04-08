#!/usr/bin/awk -f

# Generate rules to build and manipulate lagoon docker images.
# For usage, see the Makefile.

# use the Dockerfile path to generate a make target
function genTarget(dockerfile)
{
	# obtain the Dockerfile path prefix and suffix
	split(dockerfile, path, /\/Dockerfile/);
	# use the path prefix to build the normalised target name
	target = path[1]
	gsub(/\//, "-", target);
	# replace the path prefix with the build prefix in two stages in case there
	# is no build prefix - e.g. cli pod
	# in the case of "local-dev", just replace the "dev" part to match naming
	# used by the existing build system
	sub(/images-|services-|dev-/, "", target);
	sub(/^/, "build\:", target);
	# the Dockerfile may have a hyphenated suffix, so append it to the target
	# e.g. -galera
	return target path[2]
}

# generate a normalised dependency name from an image name
function genDependency(image) {
	# return immediately if image is empty
	if (image == "") { return image }
	# strip unused suffixes
	sub(/:\${LAGOON_GIT_BRANCH:-latest} as yarn-workspace-builder/, "", image);
	sub(/ as .+/, "", image);
	# replace colons with hyphens in the path
	gsub(/:/, "-", image);
	# add the build prefix
	sub(/^/, " build\:", image);
	return image
}

# append the rule's target to the list of all targets, the tag to the list of
# all tags, and associate the image class with the tag
function appendToLists(rule, class, tag) {
	sub(/:( .*|$)/, "", rule)
	allTargets = allTargets " " rule
	allTags = allTags " " tag
	allTagsByClass[class] = allTagsByClass[class] " " tag
}

# given a full target (target name and dependencies), and a dockerfile path,
# generate rule(s) for building an image or set of versioned images
function genBuildRules(fullTarget, dockerfile) {
	# the rules variable stores the full make targets and recipes
	rules = ""
	# get the context path
	context = dockerfile
	sub(/\/Dockerfile.*/, "", context);
	# remove version placeholder
	gsub(/-\${.+_VERSION}/, "", fullTarget);
	# extract the image name
	name = fullTarget;
	sub(/^build\\:/, "", name);
	sub(/:.*/, "", name);
	# extract the image class
	class = dockerfile
	sub(/\/.*$/, "", class);
	if (fullTarget ~ /^build\\:php/) {
		# extract the image type
		type = fullTarget;
		sub(/^build\\:php/, "", type);
		sub(/:.+/, "", type);
		# create array of versions
		split(PHP_VERSIONS, versions, " ");
		# construct the rules
		for (i in versions) {
			# insert the version
			rule = fullTarget;
			gsub(/php/, "php-" versions[i], rule);
			# assemble the tag
			tag = "php:" versions[i] type
			appendToLists(rule, class, tag)
			# append the recipe to the rules
			rules = rules rule "\n\t$(call docker_build_version_cmd,php," \
						versions[i] "," versions[i] type "," dockerfile "," context ")\n";
		}
	} else if (fullTarget ~ /^build\\:node/) {
		# extract the image type
		type = fullTarget;
		sub(/^build\\:node/, "", type);
		sub(/:.+/, "", type);
		# create array of versions
		split(NODE_VERSIONS, versions, " ");
		# construct the rules
		for (i in versions) {
			# insert the version
			rule = fullTarget;
			gsub(/node/, "node-" versions[i], rule);
			# append versioned target and tag to the lists of all targets and tags
			tag = "node:" versions[i] type
			appendToLists(rule, class, tag)
			# append the recipe to the rules
			rules = rules rule "\n\t$(call docker_build_version_cmd,node," \
						versions[i] "," versions[i] type "," dockerfile "," context")\n";
		}
	} else if (fullTarget ~ /^build\\:python/) {
		# extract the image type
		type = fullTarget;
		sub(/^build\\:python/, "", type);
		sub(/:.+/, "", type);
		# create array of versions
		split(PYTHON_VERSIONS, versions, " ");
		# construct the rules
		for (i in versions) {
			# insert the version
			rule = fullTarget;
			gsub(/python/, "python-" versions[i], rule);
			# append versioned target and tag to the lists of all targets and tags
			tag = "python:" versions[i] type
			appendToLists(rule, class, tag)
			# append the recipe to the rules
			if (versions[i] ~ /2.7/) {
				rules = rules rule "\n\t$(call docker_build_version_cmd,python," \
							versions[i] "," versions[i] type "," dockerfile "," \
							context",3.10)\n";
			} else {
				rules = rules rule "\n\t$(call docker_build_version_cmd,python," \
							versions[i] "," versions[i] type "," dockerfile "," context")\n";
			}
		}
	} else if (fullTarget ~ /^build\\:solr/) {
		# extract the image type
		type = fullTarget;
		sub(/^build\\:solr/, "", type);
		sub(/:.+/, "", type);
		# create array of versions
		split(SOLR_VERSIONS, versions, " ");
		# construct the rules
		for (i in versions) {
			# insert the version
			rule = fullTarget;
			gsub(/solr/, "solr-" versions[i], rule);
			# append versioned target and tag to the lists of all targets and tags
			tag = "solr:" versions[i] type
			appendToLists(rule, class, tag)
			# append the recipe to the rules
			rules = rules rule "\n\t$(call docker_build_version_cmd,solr," \
						versions[i] "," versions[i] type "," dockerfile "," context")\n";
		}
	} else if (fullTarget ~ /^build\\:(elasticsearch|kibana|logstash)/) {
		# create array of versions
		split(ELASTIC_VERSIONS, versions, " ");
		# construct the rules
		for (i in versions) {
			# generate the minor version by stripping the patch version
			minorVer = sprintf("%.3s", versions[i])
			# insert the version
			rule = fullTarget;
			gsub(/kibana/, "kibana-" minorVer, rule);
			gsub(/elasticsearch/, "elasticsearch-" minorVer, rule);
			gsub(/logstash/, "logstash-" minorVer, rule);
			# append the recipe to the rules
			rules = rules rule "\n\t$(call docker_build_version_cmd," name "," \
						versions[i] "," minorVer "," dockerfile "," context")\n";
			# append versioned target and tag to the lists of all targets and tags
			tag = name ":" minorVer
			appendToLists(rule, class, tag)
		}
	} else if (fullTarget ~ /^build\\:(ssh|yarn-workspace-builder|drush-alias-testing)/) {
		# these images use lagoon repo root context
		rules = fullTarget \
					"\n\t$(call docker_build_cmd," name "," dockerfile ",.)\n";
		# append target and tag to the lists of all targets and tags
		appendToLists(fullTarget, class, name)
	} else {
		# append the recipe to the rules
		rules = fullTarget \
					"\n\t$(call docker_build_cmd," name "," dockerfile "," context ")\n";
		# append target and tag to the lists of all targets and tags
		appendToLists(fullTarget, class, name)
	}
	return rules
}

# generate the s3-save rules
function genS3SaveRules(allTags) {
	split(allTags, tags, " ")
	allRules = "build\:s3-save:"
	rules = ""
	for (i in tags) {
		# tag may have a colon, so generate a clean version for target names
		cleanTarget = tags[i]
		gsub(/:/, "-", cleanTarget)
		cleanTarget = "build\\:s3-save-" cleanTarget
		allRules = allRules " " cleanTarget
		rules = rules ".PHONY: " cleanTarget "\n" cleanTarget ":\n" \
					"\tdocker save $(CI_BUILD_TAG)/" tags[i] \
					" $$(docker history -q $(CI_BUILD_TAG)/" tags[i] \
					" | grep -v missing) | gzip -9 | aws s3 cp - s3://lagoon-images/" \
					tags[i] ".tar.gz\n"
	}
	return allRules " ## Save container images to S3\n" rules
}

# generate the s3-load rules
function genS3LoadRules(allTags) {
	split(allTags, tags, " ")
	allRules = "build\:s3-load:"
	rules = ""
	for (i in tags) {
		# tag may have a colon, so generate a clean version for target names
		cleanTarget = tags[i]
		gsub(/:/, "-", cleanTarget)
		cleanTarget = "build\\:s3-load-" cleanTarget
		allRules = allRules " " cleanTarget
		rules = rules ".PHONY: " cleanTarget "\n" cleanTarget ":\n" \
					"\tcurl -s https://s3.us-east-2.amazonaws.com/lagoon-images/" \
					tags[i] ".tar.gz | gunzip -c | docker load\n"
	}
	return allRules " ## Load container images from S3\n" rules
}

# generate the push-minishift rules
function genPushMinishiftRules(baseImageTags) {
	split(baseImageTags, tags, " ")
	allRules = "build\:push-minishift:"
	rules = ""
	for (i in tags) {
		# tag may have a colon, so generate a clean version for target names
		cleanTarget = tags[i]
		gsub(/:/, "-", cleanTarget)
		cleanTarget = "build\\:push-minishift-" cleanTarget
		allRules = allRules " " cleanTarget
		rules = rules ".PHONY: " cleanTarget "\n" cleanTarget ":\n" \
					"\t@if docker inspect $(CI_BUILD_TAG)/" tags[i] \
					" > /dev/null 2>&1; then \\\n" \
					"\t\techo pushing " tags[i] " to minishift registry; \\\n" \
					"\t\tdocker tag $(CI_BUILD_TAG)/" tags[i] \
					" $$(cat minishift):30000/lagoon/" tags[i] " && \\\n" \
					"\t\tdocker push $$(cat minishift):30000/lagoon/" tags[i] "; \\\n" \
					"\tfi\n"
	}
	return allRules " ## Push any available built images to the local minishift registry\n" rules
}

# generate the publish:amazeeio-baseimages rules
function genPublishAmazeeioBaseimages(baseImageTags) {
	split(baseImageTags, tags, " ")
	allRules = "publish\:amazeeio-baseimages:"
	rules = ""
	for (i in tags) {
		# tag may have a colon, so generate a clean version for target names
		cleanTarget = tags[i]
		gsub(/:/, "-", cleanTarget)
		cleanTarget = "publish\\:amazeeio-baseimages-" cleanTarget
		allRules = allRules " " cleanTarget
		rules = rules ".PHONY: " cleanTarget "\n" cleanTarget ":\n"
		if (tags[i] ~ /:/) {
			# if the target is already tagged, flavour appends to the tag, and we
			# also push an unflavoured image
			rules = rules \
						"\t$(call docker_publish_amazeeio," tags[i] "," tags[i] ")\n" \
						"\t$(call docker_publish_amazeeio," tags[i] "," tags[i] "-latest)\n" \
						"\t$(call docker_publish_amazeeio," tags[i] "," tags[i] "-$(LAGOON_VERSION))\n"
		} else {
			# if the target is not tagged, flavour _is_ the tag
			rules = rules \
						"\t$(call docker_publish_amazeeio," tags[i] "," tags[i] ":latest)\n" \
						"\t$(call docker_publish_amazeeio," tags[i] "," tags[i] ":$(LAGOON_VERSION))\n"
		}
	}
	return allRules " ## Push base images to the amazeeio org on docker hub\n" rules
}

# generate the publish:amazeeiolagoon-baseimages rules
function genPublishAmazeeiolagoonBaseimages(baseImageTags) {
	split(baseImageTags, tags, " ")
	allRules = "publish\:amazeeiolagoon-baseimages:"
	rules = ""
	for (i in tags) {
		# tag may have a colon, so generate a clean version for target names
		cleanTarget = tags[i]
		gsub(/:/, "-", cleanTarget)
		cleanTarget = "publish\\:amazeeiolagoon-baseimages-" cleanTarget
		allRules = allRules " " cleanTarget
		rules = rules ".PHONY: " cleanTarget "\n" cleanTarget ":\n"
		if (tags[i] ~ /:/) {
			# if the target is already tagged, flavour appends to the tag, and we
			# also push an unflavoured image
			rules = rules \
						"\t$(call docker_publish_amazeeiolagoon," tags[i] "," tags[i] "-$(BRANCH_NAME))\n"
		} else {
			# if the target is not tagged, flavour _is_ the tag
			rules = rules \
						"\t$(call docker_publish_amazeeiolagoon," tags[i] "," tags[i] ":$(BRANCH_NAME))\n"
		}
	}
	return allRules " ## Push base images to the amazeeiolagoon org on docker hub\n" rules
}

# generate the publish:amazeeiolagoon-serviceimages rules
function genPublishAmazeeiolagoonServiceimages(serviceImageTags) {
	split(serviceImageTags, tags, " ")
	allRules = "publish\:amazeeiolagoon-serviceimages:"
	rules = ""
	for (i in tags) {
		# tag may have a colon, so generate a clean version for target names
		cleanTarget = tags[i]
		gsub(/:/, "-", cleanTarget)
		cleanTarget = "publish\\:amazeeiolagoon-serviceimages-" cleanTarget
		allRules = allRules " " cleanTarget
		rules = rules ".PHONY: " cleanTarget "\n" cleanTarget ":\n" \
						 "\t$(call docker_publish_amazeeiolagoon," tags[i] "," tags[i] ":$(BRANCH_NAME))\n"
	}
	return allRules " ## Push service images to the amazeeio org on docker hub\n" rules
}

# set the field separator so that
# $1 is the Dockerfile path
# $2 is the image name (and may have some trailing junk)
BEGIN { FS = ":FROM \${IMAGE_REPO:-.*}/" }

{
	image = $2;
	# check if this is the same Dockerfile as the previous record
	if (dockerfile == $1) {
		# same Dockerfile? just add the dependency to the target list and go to
		# the next record
		fullTarget = fullTarget genDependency(image);
		next;
	} else if (dockerfile != "") {
		# different Dockerfile? last one's dependencies must be complete so
		# generate the versions and the recipes using the dockerfile path
		printf genBuildRules(fullTarget, dockerfile)
	}
	# store the Dockerfile path before moving to the next record
	dockerfile = $1;
	fullTarget = genTarget(dockerfile) ":" genDependency(image)
}

END {
	# the block above will only print the rule for a given dockerfile after
	# encountering the _next_ line with a differing dockerfile, so we need to
	# print the last rule(s) here
	printf genBuildRules(fullTarget, dockerfile)
	# generate the s3 rules
	printf genS3SaveRules(allTags)
	printf genS3LoadRules(allTags)
	# generate the push-minishift rule
	printf genPushMinishiftRules(allTagsByClass["images"])
	# generate the publish rules
	printf genPublishAmazeeioBaseimages(allTagsByClass["images"])
	printf genPublishAmazeeiolagoonBaseimages(allTagsByClass["images"])
	printf genPublishAmazeeiolagoonServiceimages(allTagsByClass["services"] allTagsByClass["cli"])
	# print the build:all target, with dependencies on all others
	print "build\:all:" allTargets " ## Build all lagoon images"
	# .PHONY-ify all the things
	print ".PHONY: build\:all build\:list build\:s3-save build\:s3-load" \
					 " build\:push-minishift publish\:amazeeio-baseimages" \
					 " publish\:amazeeiolagoon-baseimages" \
					 " publish\:amazeeiolagoon-serviceimages" allTargets
	# generate the build-list rule
	# this one is last because we mutate allTargets for it
	gsub(/\\/, "", allTargets)
	gsub(/ /, "\\n", allTargets)
	print "build\:list: ## List all image build targets\n\t@printf \"build:all" allTargets "\\n\""
}
