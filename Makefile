SHELL := /bin/bash
# amazee.io lagoon Makefile The main purpose of this Makefile is to provide easier handling of
# building images and running tests It understands the relation of the different images (like
# nginx-drupal is based on nginx) and builds them in the correct order Also it knows which
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

# make minishift
# Some tests need a full openshift running in order to test deployments and such. This can be
# started via openshift. It will:
# 1. Download minishift cli
# 2. Start an OpenShift Cluster
# 3. Configure OpenShift cluster to our needs

# make minishift/stop
# Removes an OpenShift Cluster

# make minishift/clean
# Removes all openshift related things: OpenShift itself and the minishift cli

#######
####### Default Variables
#######

# Parameter for all `docker build` commands, can be overwritten with `DOCKER_BUILD_PARAMS=` in cli
DOCKER_BUILD_PARAMS := --quiet

# Version and Hash of the OpenShift cli that should be downloaded
MINISHIFT_VERSION := 1.9.0

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

# Build a PHP docker image. Expects as arguments:
# 1. PHP version
# 2. PHP version and type of image (ie 7.0-fpm, 7.0-cli etc)
# 3. Location of Dockerfile
# 4. Path of Docker Build Context
docker_build_php = docker build $(DOCKER_BUILD_PARAMS) --build-arg IMAGE_REPO=$(CI_BUILD_TAG) --build-arg PHP_VERSION=$(1) -t $(CI_BUILD_TAG)/php:$(2) -f $(3) $(4)

docker_build_node = docker build $(DOCKER_BUILD_PARAMS) --build-arg IMAGE_REPO=$(CI_BUILD_TAG) --build-arg NODE_VERSION=$(1) -t $(CI_BUILD_TAG)/node:$(2) -f $(3) $(4)

docker_build_solr = docker build $(DOCKER_BUILD_PARAMS) --build-arg IMAGE_REPO=$(CI_BUILD_TAG) --build-arg SOLR_MAJ_MIN_VERSION=$(1) -t $(CI_BUILD_TAG)/solr:$(2) -f $(3) $(4)

# Tags and image with the `amazeeio` repository and pushes it
docker_publish_amazeeio_baseimages = docker tag $(CI_BUILD_TAG)/$(1) amazeeio/$(1) && docker push amazeeio/$(1) | cat

# Tags and image with the `amazeeiolagoon` repository and pushes it
docker_publish_amazeeiolagoon_serviceimages = docker tag $(CI_BUILD_TAG)/$(1) amazeeiolagoon/$(1):$(PUBLISH_TAG) && docker push amazeeiolagoon/$(1):$(PUBLISH_TAG) | cat
docker_publish_amazeeiolagoon_baseimages = docker tag $(CI_BUILD_TAG)/$(1) amazeeiolagoon/$(PUBLISH_TAG)-$(1) && docker push amazeeiolagoon/$(PUBLISH_TAG)-$(1) | cat


#######
####### Base Images
#######
####### Base Images are the base for all other images and are also published for clients to use during local development

images :=     centos7 \
							oc \
							mariadb \
							mariadb-drupal \
							oc-build-deploy-dind \
							commons \
							nginx \
							nginx-drupal \
							varnish \
							varnish-drupal \
							redis \
							mongo \
							elasticsearch \
							kibana \
							logstash \
							docker-host

# base-images is a variable that will be constantly filled with all base image there are
base-images += $(images)

# List with all images prefixed with `build/`. Which are the commands to actually build images
build-images = $(foreach image,$(images),build/$(image))

# Define the make recepie for all base images
$(build-images):
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
build/mariadb: build/commons images/mariadb/Dockerfile
build/mariadb-drupal: build/mariadb images/mariadb-drupal/Dockerfile
build/commons: images/commons/Dockerfile
build/nginx: build/commons images/nginx/Dockerfile
build/nginx-drupal: build/nginx images/nginx-drupal/Dockerfile
build/varnish: build/commons images/varnish/Dockerfile
build/varnish-drupal: build/varnish images/varnish-drupal/Dockerfile
build/redis: build/commons images/redis/Dockerfile
build/mongo: build/centos7 images/mongo/Dockerfile
build/elasticsearch: build/commons images/elasticsearch/Dockerfile
build/logstash: build/commons images/logstash/Dockerfile
build/kibana: build/commons images/kibana/Dockerfile
build/docker-host: build/commons images/docker-host/Dockerfile
build/oc: build/commons images/oc/Dockerfile
build/oc-build-deploy-dind: build/oc images/oc-build-deploy-dind

#######
####### PHP Images
#######
####### PHP Images are alpine linux based PHP images.

phpimages := 	php__5.6-fpm \
							php__7.0-fpm \
							php__7.1-fpm  \
							php__5.6-cli \
							php__7.0-cli \
							php__7.1-cli \
							php__5.6-cli-drupal \
							php__7.0-cli-drupal \
							php__7.1-cli-drupal


build-phpimages = $(foreach image,$(phpimages),build/$(image))

# Define the make recepie for all base images
$(build-phpimages): build/commons
	$(eval clean = $(subst build/php__,,$@))
	$(eval version = $(word 1,$(subst -, ,$(clean))))
	$(eval type = $(word 2,$(subst -, ,$(clean))))
	$(eval subtype = $(word 3,$(subst -, ,$(clean))))
# this fills variables only if $type is existing, if not they are just empty
	$(eval type_dash = $(if $(type),-$(type)))
	$(eval type_slash = $(if $(type),/$(type)))
# if there is a subtype, add it. If not, just keep what we already had
	$(eval type_dash = $(if $(subtype),-$(type)-$(subtype),$(type_dash)))
	$(eval type_slash = $(if $(subtype),/$(type)-$(subtype),$(type_slash)))
# Call the docker build
	$(call docker_build_php,$(version),$(version)$(type_dash),images/php$(type_slash)/Dockerfile,images/php$(type_slash))
# Touch an empty file which make itself is using to understand when the image has been last build
	touch $@

base-images += $(phpimages)

build/php__5.6-fpm build/php__7.0-fpm build/php__7.1-fpm: images/commons
build/php__5.6-cli: build/php__5.6-fpm
build/php__7.0-cli: build/php__7.0-fpm
build/php__7.1-cli: build/php__7.1-fpm
build/php__5.6-cli-drupal: build/php__5.6-cli
build/php__7.0-cli-drupal: build/php__7.0-cli
build/php__7.1-cli-drupal: build/php__7.1-cli

#######
####### Solr Images
#######
####### Solr Images are alpine linux based Solr images.

solrimages := 	solr__5.5 \
								solr__6.6 \
								solr__5.5-drupal \
								solr__6.6-drupal


build-solrimages = $(foreach image,$(solrimages),build/$(image))

# Define the make recepie for all base images
$(build-solrimages): build/commons
	$(eval clean = $(subst build/solr__,,$@))
	$(eval version = $(word 1,$(subst -, ,$(clean))))
	$(eval type = $(word 2,$(subst -, ,$(clean))))
# this fills variables only if $type is existing, if not they are just empty
	$(eval type_dash = $(if $(type),-$(type)))
# Call the docker build
	$(call docker_build_solr,$(version),$(version)$(type_dash),images/solr$(type_dash)/Dockerfile,images/solr$(type_dash))
# Touch an empty file which make itself is using to understand when the image has been last build
	touch $@

base-images += $(solrimages)

build/solr__5.5  build/solr__6.6: images/commons
build/solr__5.5-drupal: build/solr__5.5
build/solr__6.6-drupal: build/solr__6.6

#######
####### Node Images
#######
####### Node Images are alpine linux based Node images.

nodeimages := node__8 \
							node__6 \
							node__8-builder \
							node__6-builder

build-nodeimages = $(foreach image,$(nodeimages),build/$(image))

# Define the make recepie for all base images
$(build-nodeimages): build/commons
	$(eval clean = $(subst build/node__,,$@))
	$(eval version = $(word 1,$(subst -, ,$(clean))))
	$(eval type = $(word 2,$(subst -, ,$(clean))))
# this fills variables only if $type is existing, if not they are just empty
	$(eval type_dash = $(if $(type),-$(type)))
	$(eval type_slash = $(if $(type),/$(type)))
# Call the docker build
	$(call docker_build_node,$(version),$(version)$(type_dash),images/node$(type_slash)/Dockerfile,images/node$(type_slash))
# Touch an empty file which make itself is using to understand when the image has been last build
	touch $@

base-images += $(nodeimages)

build/node__8 build/node__6: images/commons images/node/Dockerfile
build/node__8-builder: build/node__8 images/node/builder/Dockerfile
build/node__6-builder: build/node__6 images/node/builder/Dockerfile

#######
####### Service Images
#######
####### Services Images are the Docker Images used to run the Lagoon Microservices, these images
####### will be expected by docker-compose to exist.

# Yarn Workspace Image which builds the Yarn Workspace within a single image. This image will be
# used by all microservices based on Node.js to not build similar node packages again
build-images += yarn-workspace-builder
build/yarn-workspace-builder: build/node__8-builder images/yarn-workspace-builder/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),images/$(image)/Dockerfile,.)
	touch $@

# Variables of service images we manage and build
services :=       api \
									auth-server \
									logs2slack \
									openshiftbuilddeploy \
									openshiftbuilddeploymonitor \
									openshiftremove \
									rest2tasks \
									webhook-handler \
									webhooks2tasks \
									hacky-rest2tasks-ui \
									rabbitmq \
									logs-db \
									logs-db-ui \
									logs2logs-db \
									auto-idler \
									api-db \
									drush-alias

service-images += $(services)
build-services = $(foreach image,$(services),build/$(image))

# Recepie for all building service-images
$(build-services):
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),services/$(image)/Dockerfile,services/$(image))
	touch $@

# Dependencies of Service Images
build/auth-server build/logs2slack build/openshiftbuilddeploy build/openshiftbuilddeploymonitor build/openshiftremove build/rest2tasks build/webhook-handler build/webhooks2tasks build/api: build/yarn-workspace-builder
build/hacky-rest2tasks-ui: build/node__8
build/logs2logs-db: build/logstash
build/logs-db: build/elasticsearch
build/logs-db-ui: build/kibana
build/auto-idler: build/oc

# Auth SSH needs the context of the root folder, so we have it individually
build/ssh: build/commons
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),services/$(image)/Dockerfile,.)
	touch $@
service-images += ssh
# CLI Image
build/cli: build/node__8
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	touch $@
service-images += cli

# Images for local helpers that exist in another folder than the service images
localdevimages := local-git \
									local-api-data-watcher-pusher
service-images += $(localdevimages)
build-localdevimages = $(foreach image,$(localdevimages),build/$(image))

$(build-localdevimages):
	$(eval folder = $(subst build/local-,,$@))
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),local-dev/$(folder)/Dockerfile,local-dev/$(folder))
	touch $@

build/local-git-server: build/centos7

# Image with ansible test
build/tests:
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	touch $@
service-images += tests
#######
####### Commands
#######
####### List of commands in our Makefile

# Builds all Images
.PHONY: build
build: $(foreach image,$(base-images) $(service-images),build/$(image))
# Outputs a list of all Images we manage
.PHONY: build-list
build-list:
	@for number in $(foreach image,$(build-images),build/$(image)); do \
			echo $$number ; \
	done

# Define list of all tests
all-tests-list:=	features \
									ssh \
									node \
									drupal \
									github \
									gitlab \
									bitbucket \
									rest \
									nginx
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
.PHONY: tests/ssh
tests/ssh: build/ssh build/auth-server build/api build/tests
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d ssh auth-server api tests
		IMAGE_REPO=$(CI_BUILD_TAG) docker exec -i $$(docker-compose -p $(CI_BUILD_TAG) ps -q tests) ansible-playbook /ansible/tests/$(testname).yaml

# Define a list of which Lagoon Services are needed for running any deployment testing
deployment-test-services-main = rabbitmq openshiftremove openshiftbuilddeploy openshiftbuilddeploymonitor logs2slack api ssh auth-server local-git local-api-data-watcher-pusher tests

# All Tests that use REST endpoints
rest-tests = rest node features nginx
run-rest-tests = $(foreach image,$(rest-tests),tests/$(image))
# List of Lagoon Services needed for REST endpoint testing
deployment-test-services-rest = $(deployment-test-services-main) rest2tasks
.PHONY: $(run-rest-tests)
$(run-rest-tests): minishift build/node__6-builder build/node__8-builder build/oc-build-deploy-dind $(foreach image,$(deployment-test-services-rest),build/$(image)) push-minishift
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-rest)
		IMAGE_REPO=$(CI_BUILD_TAG) docker exec -i $$(docker-compose -p $(CI_BUILD_TAG) ps -q tests) ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)

tests/drupal: minishift build/varnish-drupal build/solr__5.5-drupal build/nginx-drupal build/redis build/php__5.6-cli-drupal build/php__7.0-cli-drupal build/php__7.1-cli-drupal  build/mariadb build/mariadb-drupal build/oc-build-deploy-dind $(foreach image,$(deployment-test-services-rest),build/$(image)) build/drush-alias push-minishift

		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-rest) drush-alias
		IMAGE_REPO=$(CI_BUILD_TAG) docker exec -i $$(docker-compose -p $(CI_BUILD_TAG) ps -q tests) ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)

# All tests that use Webhook endpoints
webhook-tests = github gitlab bitbucket
run-webhook-tests = $(foreach image,$(webhook-tests),tests/$(image))
# List of Lagoon Services needed for webhook endpoint testing
deployment-test-services-webhooks = $(deployment-test-services-main) webhook-handler webhooks2tasks
.PHONY: $(run-webhook-tests)
$(run-webhook-tests): openshift build/node__6-builder build/node__8-builder build/oc-build-deploy-dind $(foreach image,$(deployment-test-services-webhooks),build/$(image)) push-minishift
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-webhooks)
		IMAGE_REPO=$(CI_BUILD_TAG) docker exec -i $$(docker-compose -p $(CI_BUILD_TAG) ps -q tests) ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)

# push command of our base images into minishift
push-minishift-images = $(foreach image,$(base-images),[push-minishift]-$(image))
# tag and push all images
.PHONY: push-minishift
push-minishift: minishift/login-docker-registry $(push-minishift-images)
# tag and push of each image
.PHONY: $(push-minishift-images)
$(push-minishift-images):
	$(eval image = $(subst [push-minishift]-,,$@))
	$(eval image = $(subst __,:,$(image)))
	$(info pushing $(image) to minishift registry)
	docker tag $(CI_BUILD_TAG)/$(image) $$(cat minishift):30000/lagoon/$(image)
	docker push $$(cat minishift):30000/lagoon/$(image) | cat

push-docker-host-image: build/docker-host minishift/login-docker-registry
	docker tag $(CI_BUILD_TAG)/docker-host $$(cat minishift):30000/lagoon/docker-host
	docker push $$(cat minishift):30000/lagoon/docker-host | cat

lagoon-kickstart: $(foreach image,$(deployment-test-services-rest),build/$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) CI_USE_OPENSHIFT_REGISTRY=false docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-rest)
	sleep 30
	curl -X POST http://localhost:5555/deploy -H 'content-type: application/json' -d '{ "projectName": "lagoon", "branchName": "master" }'
	make logs

# Publish command to amazeeio docker hub, this should probably only be done during a master deployments
publish-amazeeio-baseimages = $(foreach image,$(base-images),[publish-amazeeio-baseimages]-$(image))

# tag and push all images
.PHONY: publish-amazeeio-baseimages
publish-amazeeio-baseimages: $(publish-amazeeio-baseimages)
# tag and push of each image
.PHONY: $(publish-amazeeio-baseimages)
$(publish-amazeeio-baseimages):
#   Calling docker_publish for image, but remove the prefix '[[publish]]-' first
		$(eval image = $(subst [publish-amazeeio-baseimages]-,,$@))
		$(eval image = $(subst __,:,$(image)))
		$(call docker_publish_amazeeio_baseimages,$(image))


# Publish command to amazeeio docker hub, this should probably only be done during a master deployments
publish-amazeeiolagoon-baseimages = $(foreach image,$(base-images),[publish-amazeeiolagoon-baseimages]-$(image))

# tag and push all images
.PHONY: publish-amazeeiolagoon-baseimages
publish-amazeeiolagoon-baseimages: $(publish-amazeeiolagoon-baseimages)
# tag and push of each image
.PHONY: $(publish-amazeeiolagoon-baseimages)
$(publish-amazeeiolagoon-baseimages):
#   Calling docker_publish for image, but remove the prefix '[[publish]]-' first
		$(eval image = $(subst [publish-amazeeiolagoon-baseimages]-,,$@))
		$(eval image = $(subst __,:,$(image)))
		$(call docker_publish_amazeeiolagoon_baseimages,$(image))

# Publish command to amazeeiolagoon docker hub, we want all branches there, so this is save to run on every deployment
publish-amazeeiolagoon-serviceimages = $(foreach image,$(service-images),[publish-amazeeiolagoon-serviceimages]-$(image))

# tag and push all images
.PHONY: publish-amazeeiolagoon-serviceimages
publish-amazeeiolagoon-serviceimages: $(publish-amazeeiolagoon-serviceimages)
# tag and push of each image
.PHONY: $(publish-amazeeiolagoon-serviceimagesimages)
$(publish-amazeeiolagoon-serviceimages):
#   Calling docker_publish for image, but remove the prefix '[[publish]]-' first
		$(eval image = $(subst [publish-amazeeiolagoon-serviceimages]-,,$@))
		$(eval image = $(subst __,:,$(image)))
		$(call docker_publish_amazeeiolagoon_serviceimages,$(image))


# Clean all build touches, which will case make to rebuild the Docker Images (Layer caching is
# still active, so this is a very safe command)
clean:
	rm -rf build/*

# Show Lagoon Service Logs
logs:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) logs --tail=10 -f $(service)

# Start all Lagoon Services
up:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d api-db
	sleep 20
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d

down:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) down -v

# kill all containers containing the name "lagoon"
kill:
	docker ps --format "{{.Names}}" | grep lagoon | xargs -t -r -n1 docker rm -f -v

openshift:
	$(info the openshift command has been renamed to minishift)

# Start Local OpenShift Cluster within a docker machine with a given name, also check if the IP
# that has been assigned to the machine is not the default one and then replace the IP in the yaml files with it
minishift: local-dev/minishift/minishift
	$(info starting minishift with name $(CI_BUILD_TAG))
	./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) start --cpus 6 --vm-driver virtualbox --openshift-version="v3.6.1"
ifeq ($(ARCH), Darwin)
	@OPENSHIFT_MACHINE_IP=$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip); \
	echo "replacing IP in local-dev/api-data/api-data.gql and docker-compose.yaml with the IP '$$OPENSHIFT_MACHINE_IP'"; \
	sed -i '' -e "s/192.168\.[0-9]\{1,3\}\.[0-9]\{3\}/$${OPENSHIFT_MACHINE_IP}/g" local-dev/api-data/api-data.gql docker-compose.yaml;
else
	@OPENSHIFT_MACHINE_IP=$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip); \
	echo "replacing IP in local-dev/api-data/api-data.gql and docker-compose.yaml with the IP '$$OPENSHIFT_MACHINE_IP'"; \
	sed -i "s/192.168\.[0-9]\{1,3\}\.[0-9]\{3\}/$${OPENSHIFT_MACHINE_IP}/g" local-dev/api-data/api-data.gql docker-compose.yaml;
endif
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	oc login -u system:admin; \
	bash -c "echo '{\"apiVersion\":\"v1\",\"kind\":\"Service\",\"metadata\":{\"name\":\"docker-registry-external\"},\"spec\":{\"ports\":[{\"port\":5000,\"protocol\":\"TCP\",\"targetPort\":5000,\"nodePort\":30000}],\"selector\":{\"docker-registry\":\"default\"},\"sessionAffinity\":\"None\",\"type\":\"NodePort\"}}' | oc --context="default/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" create -n default -f -"; \
	oc --context="default/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" adm policy add-cluster-role-to-user cluster-admin system:anonymous; \
	oc --context="default/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" adm policy add-cluster-role-to-user cluster-admin developer;
	@echo "$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip)" > $@
	@echo "wait 60secs in order to give openshift time to setup it's registry"
	sleep 60
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	for i in {10..30}; do oc --context="default/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" patch pv pv00$${i} -p '{"spec":{"storageClassName":"bulk"}}'; done;
	$(MAKE) minishift/configure-lagoon-local push-docker-host-image

minishift/login-docker-registry:
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	oc login --insecure-skip-tls-verify -u developer -p developer $$(cat minishift):8443; \
	oc whoami -t | docker login --username developer --password-stdin $$(cat minishift):30000

# Configures an openshift to use with Lagoon
.PHONY: openshift-lagoon-setup
openshift-lagoon-setup:
# Only use the minishift provided oc if we don't have one yet (allows system engineers to use their own oc)
	if ! which oc; then eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); fi; \
	oc new-project lagoon; \
	oc adm pod-network make-projects-global lagoon; \
	oc -n lagoon create serviceaccount openshiftbuilddeploy; \
	oc -n lagoon create -f openshift-setup/clusterrole-openshiftbuilddeploy.yaml; \
	oc -n lagoon adm policy add-cluster-role-to-user openshiftbuilddeploy -z openshiftbuilddeploy; \
	oc -n lagoon create -f openshift-setup/shared-resource-viewer.yaml; \
	oc -n lagoon create -f openshift-setup/policybinding.yaml; \
	oc -n lagoon create serviceaccount docker-host; \
	oc -n lagoon adm policy add-scc-to-user privileged -z docker-host; \
	oc -n lagoon policy add-role-to-user system:image-pusher -z docker-host; \
	oc -n lagoon create serviceaccount cronjob; \
	oc -n lagoon policy add-role-to-user system:image-pusher -z cronjob; \
	bash -c "oc process -n lagoon -f openshift-setup/docker-host.yaml | oc -n lagoon apply -f -"; \
	bash -c "oc process -n lagoon -f openshift-setup/docker-host-cronjobs.yaml | oc -n lagoon apply -f -"; \
	echo -e "\n\nAll Setup, use this token as described in the Lagoon Install Documentation:" \
	oc -n lagoon serviceaccounts get-token openshiftbuilddeploy


# This calles the regular openshift-lagoon-setup first, which configures our minishift like we configure a real openshift for laggon
# It then overwrite the docker-host deploymentconfig and cronjobs to use our own just builded docker-host images
.PHONY: openshift/configure-lagoon-local
minishift/configure-lagoon-local: openshift-lagoon-setup
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	bash -c "oc process -n lagoon -p IMAGE=docker-registry.default.svc:5000/lagoon/docker-host:latest -p REPOSITORY_TO_UPDATE=lagoon -f openshift-setup/docker-host-minishift.yaml | oc -n lagoon apply -f -"; \
	bash -c "oc process -n lagoon -p IMAGE=docker-registry.default.svc:5000/lagoon/docker-host:latest -p REPOSITORY_TO_UPDATE=lagoon -f openshift-setup/docker-host-cronjobs.yaml | oc -n lagoon apply -f -";

# Stop OpenShift Cluster
.PHONY: minishift/stop
minishift/stop: local-dev/minishift/minishift
	./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) delete --force
	rm minishift

# Stop OpenShift, remove downloaded minishift
.PHONY: openshift/clean
minishift/clean: minishift/stop
	rm -rf ./local-dev/minishift/minishift

# Downloads the correct oc cli client based on if we are on OS X or Linux
local-dev/minishift/minishift:
	$(info downloading minishift)
	@mkdir -p ./local-dev/minishift
ifeq ($(ARCH), Darwin)
		curl -L https://github.com/minishift/minishift/releases/download/v$(MINISHIFT_VERSION)/minishift-$(MINISHIFT_VERSION)-darwin-amd64.tgz | tar xzC local-dev/minishift --strip-components=1
else
		curl -L https://github.com/minishift/minishift/releases/download/v$(MINISHIFT_VERSION)/minishift-$(MINISHIFT_VERSION)-linux-amd64.tgz | tar xzC local-dev/minishift --strip-components=1
endif
