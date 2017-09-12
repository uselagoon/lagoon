SHELL := /bin/bash
# amazee.io lagoon Makefile The main purpose of this Makefile is to provide easier handling of
# building images and running tests It understands the relation of the different images (like
# centos7-node6 is based on centos7) and builds them in the correct order Also it knows which
# services in docker-compose.yml are depending on which base images or maybe even other service
# images
#
# The main commands are:

# make build/<imagename>
# Builds an individual image and all of it's needed parents. Run `make build-list` to get a list of
# all buildable images. Make will keep track of each build image with creating an empty file with
# the name of the image in the folder `build`. If you want to force a rebuild of the image, either
# remove that file or run `make clean`

# make build
# builds all images in the correct order. Uses existing images for layer caching, define via `TAG`
# which branch should be used

# make tests/<testname>
# Runs individual tests. In a nutshell it does:
# 1. Builds all needed images for the test
# 2. Starts needed Lagoon services for the test via docker-compose up
# 3. Executes the test
#
# Run `make tests-list` to see a list of all tests.

# make tests
# Runs all tests together. Can be executed with `-j2` for two parallel running tests

# make up
# Starts all Lagoon Services at once, usefull for local development or just to start all of them.

# make logs
# Shows logs of Lagoon Services (aka docker-compose logs -f)

# make openshift
# Some tests need a full openshift running in order to test deployments and such. This can be
# started via openshift`. It will:
# 1. Download the `oc` cli
# 2. Create a loopback device on the current machine in order to have preditable IP addresses of
#    the OpenShift Console and Registry
# 3. Start an OpenShift Cluster

# make openshift/stop
# Removes an OpenShift Cluster

# make openshift/clean
# Removes all openshift related things: OpenShift itself and the oc cli

# make publish-images
# Pushes images that will be used by amazee.io clients during local development to the amazeeio
# dockerhub registry

#######
####### Default Variables
#######

# Parameter for all `docker build` commands, can be overwritten with `DOCKER_BUILD_PARAMS=` in cli
DOCKER_BUILD_PARAMS := --quiet

# Version and Hash of the OpenShift cli that should be downloaded
OC_VERSION := v3.6.0
OC_HASH := c4dd4cf

# On CI systems like jenkins we need a way to run multiple testings at the same time. We expect the
# CI systems to define an Environment variable CI_BUILD_TAG which uniquely identifies each build.
# If it's not set we assume that we are running local and just call it lagoon.
CI_BUILD_TAG ?= lagoon

ARCH := $(shell uname)

# Docker Image Tag that should be used when publishing to docker hub registry
PUBLISH_TAG :=

#######
####### Functions
#######

# Builds a docker image. Expects as arguments: name of the image, location of Dockerfile, path of
# Docker Build Context
docker_build = docker build $(DOCKER_BUILD_PARAMS) --build-arg IMAGE_REPO=$(CI_BUILD_TAG) -t $(CI_BUILD_TAG)/$(1) -f $(2) $(3)


# Tags and image with the `amazeeio` repository and pushes it
docker_publish_amazeeio = docker tag $(CI_BUILD_TAG)/$(1) amazeeio/$(1) && docker push amazeeio/$(1) | cat

# Tags and image with the `amazeeio` repository and pushes it
docker_publish_amazeeiolagoon = docker tag $(CI_BUILD_TAG)/$(1) amazeeiolagoon/$(1):$(PUBLISH_TAG) && docker push amazeeiolagoon/$(1):$(PUBLISH_TAG) | cat


#######
####### Base Images
#######
####### Base Images are the base for all other images and are also published for clients to use during local development

# All Base Images we have
baseimages := centos7 \
							centos7-node6 \
							centos7-node8 \
							centos7-node6-builder \
							centos7-node8-builder \
							centos7-mariadb10 \
							centos7-mariadb10-drupal \
							centos7-nginx1 \
							centos7-nginx1-drupal \
							centos7-php7.0 \
							centos7-php7.0-drupal \
							centos7-php7.0-drupal-builder \
							oc \
							oc-build-deploy

# all-images is a variable that will be constantly filled with all image there are, to use for
# commands like `make build` which need to know all images existing
all-images += $(baseimages)

# List with all images prefixed with `build/`. Which are the commands to actually build images
build-baseimages = $(foreach image,$(baseimages),build/$(image))

# Define the make recepie for all base images
$(build-baseimages):
#	Generate variable image without the prefix `build/`
	$(eval image = $(subst build/,,$@))
# Call the docker build
	$(call docker_build,$(image),images/$(image)/Dockerfile,images/$(image))
# Touch an empty file which make itself is using to understand when the image has been last build
	touch $@

# Define dependencies of Base Images so that make can build them in the right order. There are two
# types of Dependencies
# 1. Parent Images, like `build/centos7-node6` is based on `build/centos7` and need to be rebuild
#    if the parent has been built
# 2. Dockerfiles of the Images itself, will cause make to rebuild the images if something has
#    changed on the Dockerfiles
build/centos7: images/centos7/Dockerfile
build/centos7-node6: build/centos7 images/centos7-node6/Dockerfile
build/centos7-node8: build/centos7 images/centos7-node8/Dockerfile
build/centos7-node6-builder: build/centos7-node6 images/centos7-node6/Dockerfile
build/centos7-node8-builder: build/centos7-node8 images/centos7-node8/Dockerfile
build/centos7-mariadb10: build/centos7 images/centos7-mariadb10/Dockerfile
build/centos7-mariadb10-drupal: build/centos7-mariadb10 images/centos7-mariadb10-drupal/Dockerfile
build/centos7-nginx1: build/centos7 images/centos7-nginx1/Dockerfile
build/centos7-nginx1-drupal: build/centos7-nginx1 images/centos7-nginx1-drupal/Dockerfile
build/centos7-php7.0: build/centos7 images/centos7-php7.0/Dockerfile
build/centos7-php7.0-drupal: build/centos7-php7.0 images/centos7-php7.0-drupal/Dockerfile
build/centos7-php7.0-drupal-builder: build/centos7-php7.0-drupal images/centos7-php7.0-drupal-builder/Dockerfile
build/oc: images/oc/Dockerfile
build/oc-build-deploy: build/oc images/oc-build-deploy/Dockerfile


#######
####### Service Images
#######
####### Services Images are the Docker Images used to run the Lagoon Microservices, these images
####### will be expected by docker-compose to exist.

# Yarn Workspace Image which builds the Yarn Workspace within a single image. This image will be
# used by all microservices based on Node.js to not build similar node packages again
all-images += yarn-workspace-builder
build/yarn-workspace-builder: build/centos7-node8-builder images/yarn-workspace-builder/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),images/$(image)/Dockerfile,.)
	touch $@

# Variables of service images we manage and build
serviceimages :=  api \
									auth-server \
									logs2slack \
									openshiftdeploy \
									openshiftremove \
									openshiftremove-resources \
									rest2tasks \
									webhook-handler \
									webhooks2tasks \
									hacky-rest2tasks-ui \
									jenkins \
									jenkins-slave \
									rabbitmq
all-images += $(serviceimages)
build-serviceimages = $(foreach image,$(serviceimages),build/$(image))

# Recepie for all building service-images
$(build-serviceimages):
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),services/$(image)/Dockerfile,services/$(image))
	touch $@

# Dependencies of Service Images
build/auth-server build/logs2slack build/openshiftdeploy build/openshiftremove build/openshiftremove-resources build/rest2tasks build/webhook-handler build/webhooks2tasks: build/yarn-workspace-builder
build/hacky-rest2tasks-ui: build/centos7-node8
build/api: build/centos7-node8-builder

# Auth SSH needs the context of the root folder, so we have it individually
build/auth-ssh: build/centos7
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),services/$(image)/Dockerfile,.)
	touch $@
all-images += auth-ssh

# CLI Image
build/cli: build/centos7-node8
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	touch $@
all-images += cli


# Images for local helpers that exist in another folder than the service images
localdevimages := local-hiera-watcher-pusher \
									local-git
all-images += $(localdevimages)
build-localdevimages = $(foreach image,$(localdevimages),build/$(image))

$(build-localdevimages):
	$(eval folder = $(subst build/local-,,$@))
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),local-dev/$(folder)/Dockerfile,local-dev/$(folder))
	touch $@

build/local-hiera-watcher-pusher build/local-git-server: build/centos7

# Image with ansible test
build/tests:
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	touch $@
all-images += tests

#######
####### Commands
#######
####### List of commands in our Makefile

# Builds all Images
.PHONY: build
build: $(foreach image,$(all-images),build/$(image))
# Outputs a list of all Images we manage
.PHONY: build-list
build-list:
	@for number in $(foreach image,$(all-images),build/$(image)); do \
			echo $$number ; \
	done

# Define list of all tests
all-tests-list:= 	ssh-auth \
									node \
									drupal \
									github \
									gitlab \
									bitbucket \
									rest \
									multisitegroup
all-tests = $(foreach image,$(all-tests-list),tests/$(image))

# Run all tests
.PHONY: tests
tests: $(all-tests)

# List of tests existing
.PHONY: tests-list
tests-list:
	@for number in $(all-tests); do \
			echo $$number ; \
	done
#### Definition of tests

# SSH-Auth test
.PHONY: tests/ssh-auth
tests/ssh-auth: build/auth-ssh build/auth-server build/api build/tests
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d auth-ssh auth-server api
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) run --name tests-$(testname)-$(CI_BUILD_TAG) --rm tests ansible-playbook /ansible/tests/$(testname).yaml

# Define a list of which Lagoon Services are needed for running any deployment testing
deployment-test-services-main = rabbitmq openshiftremove openshiftdeploy logs2slack api jenkins jenkins-slave local-git local-hiera-watcher-pusher tests

# All Tests that use REST endpoints
rest-tests = rest node multisitegroup
run-rest-tests = $(foreach image,$(rest-tests),tests/$(image))
# List of Lagoon Services needed for REST endpoint testing
deployment-test-services-rest = $(deployment-test-services-main) rest2tasks
.PHONY: $(run-rest-tests)
$(run-rest-tests): openshift build/centos7-node6-builder build/centos7-node8-builder build/oc $(foreach image,$(deployment-test-services-rest),build/$(image))
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-rest)
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) run --name tests-$(testname)-$(CI_BUILD_TAG) --rm tests ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)

tests/drupal: openshift build/centos7-mariadb10-drupal build/centos7-nginx1-drupal build/centos7-php7.0-drupal-builder build/oc $(foreach image,$(deployment-test-services-rest),build/$(image))
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-rest)
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) run --name tests-$(testname)-$(CI_BUILD_TAG) --rm tests ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)

# All tests that use Webhook endpoints
webhook-tests = github gitlab bitbucket
run-webhook-tests = $(foreach image,$(webhook-tests),tests/$(image))
# List of Lagoon Services needed for webhook endpoint testing
deployment-test-services-webhooks = $(deployment-test-services-main) webhook-handler webhooks2tasks
.PHONY: $(run-webhook-tests)
$(run-webhook-tests): openshift build/centos7-node6-builder build/centos7-node8-builder build/oc $(foreach image,$(deployment-test-services-webhooks),build/$(image))
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-webhooks)
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) run --name tests-$(testname)-$(CI_BUILD_TAG) --rm tests ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)


# Publish command to amazeeio docker hub, this should probably only be done during a master deployments
publish-image-list := $(baseimages)
publish-amazeeio-images = $(foreach image,$(publish-image-list),[publish-amazeeio]-$(image))
# tag and push all images
.PHONY: publish-amazeeio
publish-amazeeio: $(publish-amazeeio-images)
# tag and push of each image
.PHONY: $(publish-amazeeio-images)
$(publish-amazeeio-images):
#   Calling docker_publish for image, but remove the prefix '[[publish]]-' first
		$(call docker_publish_amazeeio,$(subst [publish-amazeeio]-,,$@))


# Publish command to amazeeiolagoon docker hub, we want all branches there, so this is save to run on every deployment
publish-amazeeiolagoon-images = $(foreach image,$(publish-image-list),[publish-amazeeiolagoon]-$(image))
# tag and push all images
.PHONY: publish-amazeeiolagoon
publish-amazeeiolagoon: $(publish-amazeeiolagoon-images)
# tag and push of each image
.PHONY: $(publish-amazeeiolagoon-images)
$(publish-amazeeiolagoon-images):
#   Calling docker_publish for image, but remove the prefix '[[publish]]-' first
		$(call docker_publish_amazeeiolagoon,$(subst [publish-amazeeiolagoon]-,,$@))

# Clean all build touches, which will case make to rebuild the Docker Images (Layer caching is
# still active, so this is a very safe command)
clean:
	rm -rf build/*

# Show Lagoon Service Logs
logs:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) logs --tail=10 -f $(service)

# Start all Lagoon Services
up:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d

remove-ports-from-yaml:
ifeq ($(ARCH), Darwin)
		$(error this command only works on Linux as Mac does not have a proper new version of awk)
else
		awk 's{if(/\s*-\s*"[^"]*"/) next; else s=0} /ports:/{s=1;next;}1' docker-compose.yaml > docker-compose-no-ports.yaml && mv docker-compose-no-ports.yaml docker-compose.yaml
endif

up-no-ports: remove-ports-from-yaml up

down:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) down -v

# Start Local OpenShift Cluster within a docker machine with a given name, also check if the IP
# that has been assigned to the machine is not the default one and then replace the IP in the yaml files with it
openshift: local-dev/oc/oc
	$(info starting openshift with name $(CI_BUILD_TAG))
	./local-dev/oc/oc cluster up --version="v1.5.1" --create-machine --docker-machine="$(CI_BUILD_TAG)"
	@./local-dev/oc/oc login -u system:admin > /dev/null
	@echo '{"apiVersion":"v1","kind":"Service","metadata":{"name":"docker-registry-external"},"spec":{"ports":[{"port":5000,"protocol":"TCP","targetPort":5000,"nodePort":30000}],"selector":{"docker-registry":"default"},"sessionAffinity":"None","type":"NodePort"}}' | ./local-dev/oc/oc create -n default -f -
ifeq ($(ARCH), Darwin)
	@OPENSHIFT_MACHINE_IP=$$(docker-machine ip $(CI_BUILD_TAG)); \
	if [ ! "$$OPENSHIFT_MACHINE_IP" == "192.168.99.100" ]; then \
		echo "created OpenShift Machine has not the default IP '192.168.99.100' it has '$$OPENSHIFT_MACHINE_IP'"; \
		echo "replacing IP in local-dev/hiera/amazeeio/sitegroups.yaml and docker-compose.yaml with the correct IP"; \
		sed -i '' -e "s/192.168.99.100/$${OPENSHIFT_MACHINE_IP}/g" local-dev/hiera/amazeeio/sitegroups.yaml docker-compose.yaml; \
	fi
else
	@OPENSHIFT_MACHINE_IP=$$(docker-machine ip $(CI_BUILD_TAG)); \
	if [ ! "$$OPENSHIFT_MACHINE_IP" == "192.168.99.100" ]; then \
		echo "created OpenShift Machine has not the default IP '192.168.99.100' it has '$$OPENSHIFT_MACHINE_IP'"; \
		echo "replacing IP in local-dev/hiera/amazeeio/sitegroups.yaml and docker-compose.yaml with the correct IP"; \
		sed -i "s/192.168.99.100/$${OPENSHIFT_MACHINE_IP}/g" local-dev/hiera/amazeeio/sitegroups.yaml docker-compose.yaml; \
	fi
endif
	@echo "$(CI_BUILD_TAG)" > $@

# Stop OpenShift Cluster
.PHONY: openshift/stop
openshift/stop: local-dev/oc/oc
	docker-machine stop $(CI_BUILD_TAG)
	rm openshift

# Stop OpenShift, remove downloaded cli, remove loopback
.PHONY: openshift/clean
openshift/clean: openshift/stop
	rm -rf ./local-dev/oc

# Downloads the correct oc cli client based on if we are on OS X or Linux
local-dev/oc/oc:
	$(info downloading oc)
	@mkdir local-dev/oc
ifeq ($(ARCH), Darwin)
		curl -L -o oc-mac.zip https://github.com/openshift/origin/releases/download/$(OC_VERSION)/openshift-origin-client-tools-$(OC_VERSION)-$(OC_HASH)-mac.zip
		unzip -o oc-mac.zip -d local-dev/oc
		rm -f oc-mac.zip
else
		curl -L https://github.com/openshift/origin/releases/download/$(OC_VERSION)/openshift-origin-client-tools-$(OC_VERSION)-$(OC_HASH)-linux-64bit.tar.gz | tar xzC local-dev/oc --strip-components=1
endif

