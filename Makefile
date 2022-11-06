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

#######
####### Default Variables
#######

# Parameter for all `docker build` commands, can be overwritten by passing `DOCKER_BUILD_PARAMS=` via the `-e` option
DOCKER_BUILD_PARAMS := --quiet

# On CI systems like jenkins we need a way to run multiple testings at the same time. We expect the
# CI systems to define an Environment variable CI_BUILD_TAG which uniquely identifies each build.
# If it's not set we assume that we are running local and just call it lagoon.
CI_BUILD_TAG ?= lagoon

# SOURCE_REPO is the repos where the upstream images are found (usually uselagoon, but can substiture for testlagoon)
UPSTREAM_REPO ?= uselagoon
UPSTREAM_TAG ?= latest

# BUILD_DEPLOY_IMAGE_TAG is the docker tag from uselagoon/build-deploy-image to use -
# latest is the most current release
# edge is the most current merged change
BUILD_DEPLOY_IMAGE_TAG ?= latest

# Local environment
ARCH := $(shell uname | tr '[:upper:]' '[:lower:]')
LAGOON_VERSION := $(shell git describe --tags --exact-match 2>/dev/null || echo development)
DOCKER_DRIVER := $(shell docker info -f '{{.Driver}}')

# Name of the Branch we are currently in
BRANCH_NAME := $(shell git rev-parse --abbrev-ref HEAD)
SAFE_BRANCH_NAME := $(shell echo $(BRANCH_NAME) | sed -E 's/[^[:alnum:]_.-]//g' | cut -c 1-128)

# Skip image scanning by default to make building images substantially faster
SCAN_IMAGES := false

# Init the file that is used to hold the image tag cross-reference table
$(shell >build.txt)
$(shell >scan.txt)

#######
####### Functions
#######

# Builds a docker image. Expects as arguments: name of the image, location of Dockerfile, path of
# Docker Build Context
docker_build = DOCKER_SCAN_SUGGEST=false docker build $(DOCKER_BUILD_PARAMS) --build-arg LAGOON_VERSION=$(LAGOON_VERSION) --build-arg IMAGE_REPO=$(CI_BUILD_TAG) --build-arg UPSTREAM_REPO=$(UPSTREAM_REPO) --build-arg UPSTREAM_TAG=$(UPSTREAM_TAG) -t $(CI_BUILD_TAG)/$(1) -f $(2) $(3)

scan_cmd = docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(HOME)/Library/Caches:/root/.cache/ aquasec/trivy --timeout 5m0s $(CI_BUILD_TAG)/$(1) >> scan.txt

ifeq ($(SCAN_IMAGES),true)
	scan_image = $(scan_cmd)
else
	scan_image =
endif

# Tags an image with the `testlagoon` repository and pushes it
docker_publish_testlagoon = docker tag $(CI_BUILD_TAG)/$(1) testlagoon/$(2) && docker push testlagoon/$(2) | cat

# Tags an image with the `uselagoon` repository and pushes it
docker_publish_uselagoon = docker tag $(CI_BUILD_TAG)/$(1) uselagoon/$(2) && docker push uselagoon/$(2) | cat

.PHONY: docker_pull
docker_pull:
	docker images --format "{{.Repository}}:{{.Tag}}" | grep -E '$(UPSTREAM_REPO)' | grep -E '$(UPSTREAM_TAG)' | xargs -tn1 -P8 docker pull -q || true;
	grep -Eh 'FROM' $$(find . -type f -name *Dockerfile) | grep -Ev '_REPO|_VERSION|_CACHE' | awk '{print $$2}' | sort --unique | xargs -tn1 -P8 docker pull -q


#######
####### Service Images
#######
####### Services Images are the Docker Images used to run the Lagoon Microservices, these images
####### will be expected by docker-compose to exist.

# Yarn Workspace Image which builds the Yarn Workspace within a single image. This image will be
# used by all microservices based on Node.js to not build similar node packages again
build-images += yarn-workspace-builder
build/yarn-workspace-builder: yarn-workspace-builder/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,.)
	$(call scan_image,$(image),)
	touch $@

#######
####### Task Images
#######
####### Task Images are standalone images that are used to run advanced tasks when using the builddeploy controllers.

# task-activestandby is the task image that lagoon builddeploy controller uses to run active/standby misc tasks
build/task-activestandby: taskimages/activestandby/Dockerfile

# the `taskimages` are the name of the task directories contained within `taskimages/` in the repostory root
taskimages := activestandby
# in the following process, taskimages are prepended with `task-` to make built task images more identifiable
# use `build/task-<name>` to build it, but the references in the directory structure remain simpler with
# taskimages/
#	activestandby
#	anothertask
# the resulting image will be called `task-<name>` instead of `<name>` to make it known that it is a task image
task-images += $(foreach image,$(taskimages),task-$(image))
build-taskimages = $(foreach image,$(taskimages),build/task-$(image))
$(build-taskimages):
	$(eval image = $(subst build/task-,,$@))
	$(call docker_build,task-$(image),taskimages/$(image)/Dockerfile,taskimages/$(image))
	$(call scan_image,task-$(image),)
	touch $@

# Variables of service images we manage and build
services :=	api \
			api-db \
			api-redis \
			auth-server \
			actions-handler \
			backup-handler \
			broker \
			broker-single \
			keycloak \
			keycloak-db \
			logs2notifications \
			storage-calculator \
			webhook-handler \
			webhooks2tasks \
			workflows

service-images += $(services)

build-services = $(foreach image,$(services),build/$(image))

# Recipe for all building service-images
$(build-services):
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),services/$(image)/Dockerfile,services/$(image))
	$(call scan_image,$(image),)
	touch $@

# Dependencies of Service Images
build/auth-server build/logs2notifications build/backup-handler build/webhook-handler build/webhooks2tasks build/api: build/yarn-workspace-builder
build/api-db: services/api-db/Dockerfile
build/api-redis: services/api-redis/Dockerfile
build/actions-handler: services/actions-handler/Dockerfile
build/broker-single: services/broker/Dockerfile
build/broker: build/broker-single
build/keycloak-db: services/keycloak-db/Dockerfile
build/keycloak: services/keycloak/Dockerfile
build/storage-calculator: services/storage-calculator/Dockerfile
build/tests: tests/Dockerfile
build/local-minio:
# Auth SSH needs the context of the root folder, so we have it individually
build/ssh: services/ssh/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),services/$(image)/Dockerfile,.)
	$(call scan_image,$(image),)
	touch $@
service-images += ssh

build/local-git: local-dev/git/Dockerfile
build/local-api-data-watcher-pusher: local-dev/api-data-watcher-pusher/Dockerfile
build/local-registry: local-dev/registry/Dockerfile
build/local-dbaas-provider: local-dev/dbaas-provider/Dockerfile
build/local-mongodb-dbaas-provider: local-dev/mongodb-dbaas-provider/Dockerfile
build/workflows: services/workflows/Dockerfile

# Images for local helpers that exist in another folder than the service images
localdevimages := local-git \
									local-api-data-watcher-pusher \
									local-registry \
									local-dbaas-provider \
									local-mongodb-dbaas-provider

service-images += $(localdevimages)
build-localdevimages = $(foreach image,$(localdevimages),build/$(image))

$(build-localdevimages):
	$(eval folder = $(subst build/local-,,$@))
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),local-dev/$(folder)/Dockerfile,local-dev/$(folder))
	$(call scan_image,$(image),)
	touch $@

# Image with ansible test
build/tests:
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	$(call scan_image,$(image),)
	touch $@
service-images += tests

s3-images += $(service-images)

#######
####### Commands
#######
####### List of commands in our Makefile

# Builds all Images
.PHONY: build
build: $(foreach image,$(base-images) $(service-images) $(task-images),build/$(image))
# Outputs a list of all Images we manage
.PHONY: build-list
build-list:
	@for number in $(foreach image,$(build-images),build/$(image)); do \
			echo $$number ; \
	done

# Wait for Keycloak to be ready (before this no API calls will work)
.PHONY: wait-for-keycloak
wait-for-keycloak:
	$(info Waiting for Keycloak to be ready....)
	grep -m 1 "Config of Keycloak done." <(docker-compose -p $(CI_BUILD_TAG) --compatibility logs -f keycloak 2>&1)

# Define a list of which Lagoon Services are needed for running any deployment testing
main-test-services = actions-handler broker logs2notifications api api-db api-redis keycloak keycloak-db ssh auth-server local-git local-api-data-watcher-pusher local-minio

# List of Lagoon Services needed for webhook endpoint testing
webhooks-test-services = webhook-handler webhooks2tasks backup-handler

# All tests that use Webhook endpoints
webhook-tests = github gitlab bitbucket

# All Tests that use API endpoints
api-tests = node features-kubernetes nginx elasticsearch active-standby-kubernetes node-mongodb

# All drupal tests
drupal-tests = drupal-php72 drupal-php73 drupal-php74 drupal-postgres

# These targets are used as dependencies to bring up containers in the right order.
.PHONY: main-test-services-up
main-test-services-up: $(foreach image,$(main-test-services),build/$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d $(main-test-services)
	$(MAKE) wait-for-keycloak

.PHONY: drupaltest-services-up
drupaltest-services-up: main-test-services-up $(foreach image,$(drupal-test-services),build/$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d $(drupal-test-services)

.PHONY: webhooks-test-services-up
webhooks-test-services-up: main-test-services-up $(foreach image,$(webhooks-test-services),build/$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d $(webhooks-test-services)

.PHONY: local-registry-up
local-registry-up: build/local-registry
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d local-registry

# broker-up is used to ensure the broker is running before the lagoon-builddeploy operator is installed
# when running kubernetes tests
.PHONY: broker-up
broker-up: build/broker-single
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d broker

#######
####### Publishing Images
#######
####### All main&PR images are pushed to testlagoon repository
#######

# Publish command to testlagoon docker hub, done on any main branch or PR
publish-testlagoon-baseimages = $(foreach image,$(base-images),[publish-testlagoon-baseimages]-$(image))
# tag and push all images

.PHONY: publish-testlagoon-baseimages
publish-testlagoon-baseimages: $(publish-testlagoon-baseimages)

# tag and push of each image
.PHONY: $(publish-testlagoon-baseimages)
$(publish-testlagoon-baseimages):
#   Calling docker_publish for image, but remove the prefix '[publish-testlagoon-baseimages]-' first
		$(eval image = $(subst [publish-testlagoon-baseimages]-,,$@))
# 	Publish images with version tag
		$(call docker_publish_testlagoon,$(image),$(image):$(BRANCH_NAME))


# Publish command to amazeeio docker hub, this should only be done during main deployments
publish-testlagoon-serviceimages = $(foreach image,$(service-images),[publish-testlagoon-serviceimages]-$(image))
# tag and push all images
.PHONY: publish-testlagoon-serviceimages
publish-testlagoon-serviceimages: $(publish-testlagoon-serviceimages)

# tag and push of each image
.PHONY: $(publish-testlagoon-serviceimages)
$(publish-testlagoon-serviceimages):
#   Calling docker_publish for image, but remove the prefix '[publish-testlagoon-serviceimages]-' first
		$(eval image = $(subst [publish-testlagoon-serviceimages]-,,$@))
# 	Publish images with version tag
		$(call docker_publish_testlagoon,$(image),$(image):$(BRANCH_NAME))


# Publish command to amazeeio docker hub, this should only be done during main deployments
publish-testlagoon-taskimages = $(foreach image,$(task-images),[publish-testlagoon-taskimages]-$(image))
# tag and push all images
.PHONY: publish-testlagoon-taskimages
publish-testlagoon-taskimages: $(publish-testlagoon-taskimages)

# tag and push of each image
.PHONY: $(publish-testlagoon-taskimages)
$(publish-testlagoon-taskimages):
#   Calling docker_publish for image, but remove the prefix '[publish-testlagoon-taskimages]-' first
		$(eval image = $(subst [publish-testlagoon-taskimages]-,,$@))
# 	Publish images with version tag
		$(call docker_publish_testlagoon,$(image),$(image):$(BRANCH_NAME))


#######
####### All tagged releases are pushed to uselagoon repository with new semantic tags
#######

# Publish command to uselagoon docker hub, only done on tags
publish-uselagoon-baseimages = $(foreach image,$(base-images),[publish-uselagoon-baseimages]-$(image))

# tag and push all images
.PHONY: publish-uselagoon-baseimages
publish-uselagoon-baseimages: $(publish-uselagoon-baseimages)

# tag and push of each image
.PHONY: $(publish-uselagoon-baseimages)
$(publish-uselagoon-baseimages):
#   Calling docker_publish for image, but remove the prefix '[publish-uselagoon-baseimages]-' first
		$(eval image = $(subst [publish-uselagoon-baseimages]-,,$@))
# 	Publish images as :latest
		$(call docker_publish_uselagoon,$(image),$(image):latest)
# 	Publish images with version tag
		$(call docker_publish_uselagoon,$(image),$(image):$(LAGOON_VERSION))


# Publish command to amazeeio docker hub, this should only be done during main deployments
publish-uselagoon-serviceimages = $(foreach image,$(service-images),[publish-uselagoon-serviceimages]-$(image))
# tag and push all images
.PHONY: publish-uselagoon-serviceimages
publish-uselagoon-serviceimages: $(publish-uselagoon-serviceimages)

# tag and push of each image
.PHONY: $(publish-uselagoon-serviceimages)
$(publish-uselagoon-serviceimages):
#   Calling docker_publish for image, but remove the prefix '[publish-uselagoon-serviceimages]-' first
		$(eval image = $(subst [publish-uselagoon-serviceimages]-,,$@))
# 	Publish images as :latest
		$(call docker_publish_uselagoon,$(image),$(image):latest)
# 	Publish images with version tag
		$(call docker_publish_uselagoon,$(image),$(image):$(LAGOON_VERSION))


# Publish command to amazeeio docker hub, this should only be done during main deployments
publish-uselagoon-taskimages = $(foreach image,$(task-images),[publish-uselagoon-taskimages]-$(image))
# tag and push all images
.PHONY: publish-uselagoon-taskimages
publish-uselagoon-taskimages: $(publish-uselagoon-taskimages)

# tag and push of each image
.PHONY: $(publish-uselagoon-taskimages)
$(publish-uselagoon-taskimages):
#   Calling docker_publish for image, but remove the prefix '[publish-uselagoon-taskimages]-' first
		$(eval image = $(subst [publish-uselagoon-taskimages]-,,$@))
# 	Publish images as :latest
		$(call docker_publish_uselagoon,$(image),$(image):latest)
# 	Publish images with version tag
		$(call docker_publish_uselagoon,$(image),$(image):$(LAGOON_VERSION))

# Clean all build touches, which will case make to rebuild the Docker Images (Layer caching is
# still active, so this is a very safe command)
clean:
	rm -rf build/*

# Conduct post-release scans on images
.PHONY: scan-images
scan-images:
	mkdir -p ./scans
	rm -f ./scans/*.txt
	@for tag in $(foreach image,$(base-images) $(service-images) $(task-images),$(image)); do \
			docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(HOME)/Library/Caches:/root/.cache/ aquasec/trivy image --timeout 5m0s $(CI_BUILD_TAG)/$$tag > ./scans/$$tag.trivy.txt ; \
			docker run --rm -v /var/run/docker.sock:/var/run/docker.sock anchore/syft $(CI_BUILD_TAG)/$$tag > ./scans/$$tag.syft.txt ; \
			docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(HOME)/Library/Caches:/var/lib/grype/db anchore/grype $(CI_BUILD_TAG)/$$tag > ./scans/$$tag.grype.txt ; \
			echo $$tag ; \
	done

# Show Lagoon Service Logs
logs:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility logs --tail=10 -f $(service)

# Start all Lagoon Services
up:
ifeq ($(ARCH), darwin)
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d
else
	# once this docker issue is fixed we may be able to do away with this
	# linux-specific workaround: https://github.com/docker/cli/issues/2290
	KEYCLOAK_URL=$$(docker network inspect -f '{{(index .IPAM.Config 0).Gateway}}' bridge):8088 \
		IMAGE_REPO=$(CI_BUILD_TAG) \
		docker-compose -p $(CI_BUILD_TAG) --compatibility up -d
endif
	$(MAKE) wait-for-keycloak

down:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility down -v --remove-orphans

# kill all containers containing the name "lagoon"
kill:
	docker ps --format "{{.Names}}" | grep lagoon | xargs -t -r -n1 docker rm -f -v

.PHONY: ui-development
ui-development: build/api build/api-db build/local-api-data-watcher-pusher build/keycloak build/keycloak-db build/broker-single build/api-redis
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d api api-db local-api-data-watcher-pusher ui keycloak keycloak-db broker api-redis

.PHONY: api-development
api-development: build/api build/api-db build/local-api-data-watcher-pusher build/keycloak build/keycloak-db build/broker-single build/api-redis
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d api api-db local-api-data-watcher-pusher keycloak keycloak-db broker api-redis

.PHONY: ui-logs-development
ui-logs-development: build/actions-handler build/api build/api-db build/local-api-data-watcher-pusher build/keycloak build/keycloak-db build/broker-single build/api-redis build/logs2notifications build/local-minio
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d api api-db actions-handler local-api-data-watcher-pusher ui keycloak keycloak-db broker api-redis logs2notifications local-minio

## CI targets

KUBECTL_VERSION := v1.23.7
HELM_VERSION := v3.9.0
KIND_VERSION = v0.14.0
GOJQ_VERSION = v0.12.8
STERN_VERSION = 2.1.20
CHART_TESTING_VERSION = v3.6.0
KIND_IMAGE = kindest/node:v1.23.6@sha256:b1fa224cc6c7ff32455e0b1fd9cbfd3d3bc87ecaa8fcb06961ed1afb3db0f9ae
TESTS = [nginx,api,features-kubernetes,bulk-deployment,features-kubernetes-2,features-variables,active-standby-kubernetes,tasks,drush,drupal-php80,drupal-postgres,python,gitlab,github,bitbucket,node-mongodb,elasticsearch,workflows]
CHARTS_TREEISH = db_migration_initcont
TASK_IMAGES = task-activestandby

# Symlink the installed kubectl client if the correct version is already
# installed, otherwise downloads it.
local-dev/kubectl:
ifeq ($(KUBECTL_VERSION), $(shell kubectl version --short --client 2>/dev/null | sed -E 's/Client Version: v([0-9.]+).*/\1/'))
	$(info linking local kubectl version $(KUBECTL_VERSION))
	ln -s $(shell command -v kubectl) ./local-dev/kubectl
else
	$(info downloading kubectl version $(KUBECTL_VERSION) for $(ARCH))
	curl -sSLo local-dev/kubectl https://storage.googleapis.com/kubernetes-release/release/$(KUBECTL_VERSION)/bin/$(ARCH)/amd64/kubectl
	chmod a+x local-dev/kubectl
endif

# Symlink the installed helm client if the correct version is already
# installed, otherwise downloads it.
local-dev/helm:
ifeq ($(HELM_VERSION), $(shell helm version --short --client 2>/dev/null | sed -nE 's/v([0-9.]+).*/\1/p'))
	$(info linking local helm version $(HELM_VERSION))
	ln -s $(shell command -v helm) ./local-dev/helm
else
	$(info downloading helm version $(HELM_VERSION) for $(ARCH))
	curl -sSL https://get.helm.sh/helm-$(HELM_VERSION)-$(ARCH)-amd64.tar.gz | tar -xzC local-dev --strip-components=1 $(ARCH)-amd64/helm
	chmod a+x local-dev/helm
endif

local-dev/kind:
ifeq ($(KIND_VERSION), $(shell kind version 2>/dev/null | sed -nE 's/kind (v[0-9.]+).*/\1/p'))
	$(info linking local kind version $(KIND_VERSION))
	ln -s $(shell command -v kind) ./local-dev/kind
else
	$(info downloading kind version $(KIND_VERSION) for $(ARCH))
	curl -sSLo local-dev/kind https://github.com/kubernetes-sigs/kind/releases/download/$(KIND_VERSION)/kind-$(ARCH)-amd64
	chmod a+x local-dev/kind
endif

local-dev/jq:
ifeq ($(GOJQ_VERSION), $(shell jq -v 2>/dev/null | sed -nE 's/gojq ([0-9.]+).*/v\1/p'))
	$(info linking local jq version $(KIND_VERSION))
	ln -s $(shell command -v jq) ./local-dev/jq
else
	$(info downloading gojq version $(GOJQ_VERSION) for $(ARCH))
ifeq ($(ARCH), darwin)
	TMPDIR=$$(mktemp -d) \
		&& curl -sSL https://github.com/itchyny/gojq/releases/download/$(GOJQ_VERSION)/gojq_$(GOJQ_VERSION)_$(ARCH)_amd64.zip -o $$TMPDIR/gojq.zip \
		&& (cd $$TMPDIR && unzip gojq.zip) && cp $$TMPDIR/gojq_$(GOJQ_VERSION)_$(ARCH)_amd64/gojq ./local-dev/jq && rm -rf $$TMPDIR
else
	curl -sSL https://github.com/itchyny/gojq/releases/download/$(GOJQ_VERSION)/gojq_$(GOJQ_VERSION)_$(ARCH)_amd64.tar.gz | tar -xzC local-dev --strip-components=1 gojq_$(GOJQ_VERSION)_$(ARCH)_amd64/gojq
	mv ./local-dev/{go,}jq
endif
	chmod a+x local-dev/jq
endif

local-dev/stern:
ifeq ($(STERN_VERSION), $(shell stern --version 2>/dev/null | sed -nE 's/stern version //p'))
	$(info linking local stern version $(KIND_VERSION))
	ln -s $(shell command -v stern) ./local-dev/stern
else
	$(info downloading stern version $(STERN_VERSION) for $(ARCH))
	curl -sSLo local-dev/stern https://github.com/derdanne/stern/releases/download/$(STERN_VERSION)/stern_$(ARCH)_amd64
	chmod a+x local-dev/stern
endif

.PHONY: helm/repos
helm/repos: local-dev/helm
	# install repo dependencies required by the charts
	./local-dev/helm repo add harbor https://helm.goharbor.io
	./local-dev/helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
	./local-dev/helm repo add stable https://charts.helm.sh/stable
	./local-dev/helm repo add bitnami https://charts.bitnami.com/bitnami
	./local-dev/helm repo add amazeeio https://amazeeio.github.io/charts/
	./local-dev/helm repo add lagoon https://uselagoon.github.io/lagoon-charts/
	./local-dev/helm repo add minio https://helm.min.io/
	./local-dev/helm repo add nats https://nats-io.github.io/k8s/helm/charts/
	./local-dev/helm repo update

# stand up a kind cluster configured appropriately for lagoon testing
.PHONY: kind/cluster
kind/cluster: local-dev/kind
	./local-dev/kind get clusters | grep -q "$(CI_BUILD_TAG)" && exit; \
		docker network create kind || true \
		&& export KUBECONFIG=$$(mktemp) \
		KINDCONFIG=$$(mktemp ./kindconfig.XXX) \
		KIND_NODE_IP=$$(docker run --rm --network kind alpine ip -o addr show eth0 | sed -nE 's/.* ([0-9.]{7,})\/.*/\1/p') \
		&& chmod 644 $$KUBECONFIG \
		&& curl -sSLo $$KINDCONFIG.tpl https://raw.githubusercontent.com/uselagoon/lagoon-charts/$(CHARTS_TREEISH)/test-suite.kind-config.yaml.tpl \
		&& envsubst < $$KINDCONFIG.tpl > $$KINDCONFIG \
		&& echo '  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]'                >> $$KINDCONFIG \
		&& echo '    endpoint = ["https://imagecache.amazeeio.cloud", "https://index.docker.io/v1/"]' >> $$KINDCONFIG \
		&& echo 'nodes:'                                                                              >> $$KINDCONFIG \
		&& echo '- role: control-plane'                                                               >> $$KINDCONFIG \
		&& echo '  image: $(KIND_IMAGE)'                                                              >> $$KINDCONFIG \
		&& echo '  extraMounts:'                                                                      >> $$KINDCONFIG \
		&& echo '  - containerPath: /var/lib/kubelet/config.json'                                     >> $$KINDCONFIG \
		&& echo '    hostPath: $(HOME)/.docker/config.json'                                           >> $$KINDCONFIG \
		&& echo '  - containerPath: /lagoon/services'                                                 >> $$KINDCONFIG \
		&& echo '    hostPath: ./services'                                                            >> $$KINDCONFIG \
		&& echo '    readOnly: false'                                                                 >> $$KINDCONFIG \
		&& echo '  - containerPath: /lagoon/node-packages'                                            >> $$KINDCONFIG \
		&& echo '    hostPath: ./node-packages'                                                       >> $$KINDCONFIG \
		&& echo '    readOnly: false'                                                                 >> $$KINDCONFIG \
		&& KIND_CLUSTER_NAME="$(CI_BUILD_TAG)" ./local-dev/kind create cluster --wait=120s --config=$$KINDCONFIG \
		&& cp $$KUBECONFIG "kubeconfig.kind.$(CI_BUILD_TAG)" \
		&& echo -e 'Interact with the cluster during the test run in Jenkins like so:\n' \
		&& echo "export KUBECONFIG=\$$(mktemp) && scp $$NODE_NAME:$$KUBECONFIG \$$KUBECONFIG && KIND_PORT=\$$(sed -nE 's/.+server:.+:([0-9]+)/\1/p' \$$KUBECONFIG) && ssh -fNL \$$KIND_PORT:127.0.0.1:\$$KIND_PORT $$NODE_NAME" \
		&& echo -e '\nOr running locally:\n' \
		&& echo -e './local-dev/kind export kubeconfig --name "$(CI_BUILD_TAG)"\n' \
		&& echo -e 'kubectl ...\n'
ifeq ($(ARCH), darwin)
	export KUBECONFIG="$$(pwd)/kubeconfig.kind.$(CI_BUILD_TAG)" && \
	if ! ifconfig lo0 | grep $$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}') -q; then sudo ifconfig lo0 alias $$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}'); fi
	docker rm --force $(CI_BUILD_TAG)-kind-proxy-32080 || true
	docker run -d --name $(CI_BUILD_TAG)-kind-proxy-32080 \
      --publish 32080:32080 \
      --link $(CI_BUILD_TAG)-control-plane:target --network kind \
      alpine/socat -dd \
      tcp-listen:32080,fork,reuseaddr tcp-connect:target:32080
endif

KIND_SERVICES = api api-db api-redis auth-server actions-handler broker keycloak keycloak-db logs2notifications webhook-handler webhooks2tasks local-api-data-watcher-pusher local-git ssh tests workflows $(TASK_IMAGES)
KIND_TESTS = local-api-data-watcher-pusher local-git tests
KIND_TOOLS = kind helm kubectl jq stern

# install lagoon charts and run lagoon test suites in a kind cluster
.PHONY: kind/test
kind/test: kind/cluster helm/repos $(addprefix local-dev/,$(KIND_TOOLS)) $(addprefix build/,$(KIND_SERVICES))
	export CHARTSDIR=$$(mktemp -d ./lagoon-charts.XXX) \
		&& ln -sfn "$$CHARTSDIR" lagoon-charts.kind.lagoon \
		&& git clone https://github.com/uselagoon/lagoon-charts.git "$$CHARTSDIR" \
		&& cd "$$CHARTSDIR" \
		&& git checkout $(CHARTS_TREEISH) \
		&& export KUBECONFIG="$$(realpath ../kubeconfig.kind.$(CI_BUILD_TAG))" \
		&& export IMAGE_REGISTRY="registry.$$(../local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& $(MAKE) install-registry HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
		&& cd .. && $(MAKE) kind/push-images && cd "$$CHARTSDIR" \
		&& $(MAKE) fill-test-ci-values TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY \
			SKIP_INSTALL_REGISTRY=true \
			LAGOON_FEATURE_FLAG_DEFAULT_ISOLATION_NETWORK_POLICY=enabled \
			USE_CALICO_CNI=true \
			LAGOON_FEATURE_FLAG_DEFAULT_ROOTLESS_WORKLOAD=enabled \
		&& docker run --rm --network host --name ct-$(CI_BUILD_TAG) \
			--volume "$$(pwd)/test-suite-run.ct.yaml:/etc/ct/ct.yaml" \
			--volume "$$(pwd):/workdir" \
			--volume "$$(realpath ../kubeconfig.kind.$(CI_BUILD_TAG)):/root/.kube/config" \
			--workdir /workdir \
			"quay.io/helmpack/chart-testing:$(CHART_TESTING_VERSION)" \
			ct install

LOCAL_DEV_SERVICES = api auth-server actions-handler logs2notifications webhook-handler webhooks2tasks

# install lagoon charts in a Kind cluster
.PHONY: kind/setup
kind/setup: kind/cluster helm/repos $(addprefix local-dev/,$(KIND_TOOLS)) $(addprefix build/,$(KIND_SERVICES))
	export CHARTSDIR=$$(mktemp -d ./lagoon-charts.XXX) \
		&& ln -sfn "$$CHARTSDIR" lagoon-charts.kind.lagoon \
		&& git clone https://github.com/uselagoon/lagoon-charts.git "$$CHARTSDIR" \
		&& cd "$$CHARTSDIR" \
		&& git checkout $(CHARTS_TREEISH) \
		&& export KUBECONFIG="$$(realpath ../kubeconfig.kind.$(CI_BUILD_TAG))" \
		&& export IMAGE_REGISTRY="registry.$$(../local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& $(MAKE) install-registry HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
		&& cd .. && $(MAKE) -j6 kind/push-images && cd "$$CHARTSDIR" \
		&& $(MAKE) fill-test-ci-values TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY

# kind/local-dev-patch will build the services in LOCAL_DEV_SERVICES on your machine, and then use kubectl patch to mount the folders into Kubernetes
# the deployments should be restarted to trigger any updated code changes
# `kubectl rollout undo deployment` can be used to rollback a deployment to before the annotated patch
# ensure that the correct version of Node to build the services is set on your machine
.PHONY: kind/local-dev-patch
kind/local-dev-patch:
	export KUBECONFIG="$$(pwd)/kubeconfig.kind.$(CI_BUILD_TAG)" && \
		export IMAGE_REGISTRY="registry.$$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& for image in $(LOCAL_DEV_SERVICES); do \
			echo "building $$image" \
			&& cd services/$$image && yarn install && yarn build && cd ../..; \
		done \
		&& for image in $(LOCAL_DEV_SERVICES); do \
			echo "patching lagoon-core-$$image" \
			&& ./local-dev/kubectl --namespace lagoon patch deployment lagoon-core-$$image --patch-file ./local-dev/kubectl-patches/$$image.yaml; \
		done

## Use local-dev-logging to deploy an Elasticsearch/Kibana cluster into docker compose and forward
## container logs to it
.PHONY: kind/local-dev-logging
kind/local-dev-logging:
	export KUBECONFIG="$$(pwd)/kubeconfig.kind.$(CI_BUILD_TAG)" \
		&& docker-compose -f local-dev/odfe-docker-compose.yml -p odfe up -d \
		&& ./local-dev/helm upgrade --install --create-namespace \
			--namespace lagoon-logs-concentrator \
			--wait --timeout 15m \
			--values ./local-dev/lagoon-logs-concentrator.values.yaml \
			lagoon-logs-concentrator \
			./lagoon-charts.kind.lagoon/charts/lagoon-logs-concentrator \
		&& ./local-dev/helm dependency update ./lagoon-charts.kind.lagoon/charts/lagoon-logging \
		&& ./local-dev/helm upgrade --install --create-namespace --namespace lagoon-logging \
			--wait --timeout 15m \
			--values ./local-dev/lagoon-logging.values.yaml \
			lagoon-logging \
			./lagoon-charts.kind.lagoon/charts/lagoon-logging \
		&& echo -e '\n\nInteract with the OpenDistro cluster at http://0.0.0.0:5601 using the default `admin/admin` credentials\n' \
		&& echo -e 'You will need to create a default index at http://0.0.0.0:5601/app/management/kibana/indexPatterns/create \n' \
		&& echo -e 'with a default `container-logs-*` pattern'

# kind/dev can only be run once a cluster is up and running (run kind/test first) - it doesn't rebuild the cluster at all, just pushes the built images
# into the image registry and reinstalls the lagoon-core helm chart.
.PHONY: kind/dev
kind/dev: $(addprefix build/,$(KIND_SERVICES))
	export KUBECONFIG="$$(realpath ./kubeconfig.kind.$(CI_BUILD_TAG))" \
		&& export IMAGE_REGISTRY="registry.$$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& $(MAKE) kind/push-images && cd lagoon-charts.kind.lagoon \
		&& $(MAKE) install-lagoon-core IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY

# kind/push-images pushes locally build images into the kind cluster registry.
IMAGES = $(KIND_SERVICES) $(LOCAL_DEV_SERVICES) $(TASK_IMAGES)
.PHONY: kind/push-images
kind/push-images:
	export KUBECONFIG="$$(pwd)/kubeconfig.kind.$(CI_BUILD_TAG)" && \
		export IMAGE_REGISTRY="registry.$$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& docker login -u admin -p Harbor12345 $$IMAGE_REGISTRY \
		&& for image in $(IMAGES); do \
			docker tag $(CI_BUILD_TAG)/$$image $$IMAGE_REGISTRY/$$image:$(SAFE_BRANCH_NAME) \
			&& docker push $$IMAGE_REGISTRY/$$image:$(SAFE_BRANCH_NAME); \
		done

# Use kind/get-admin-creds to retrieve the admin JWT, Lagoon admin password, and the password for the lagoonadmin user.
# These credentials are re-created on every re-install of Lagoon Core.
.PHONY: kind/get-admin-creds
kind/get-admin-creds:
	export KUBECONFIG="$$(realpath ./kubeconfig.kind.$(CI_BUILD_TAG))" \
		&& cd lagoon-charts.kind.lagoon \
		&& $(MAKE) get-admin-creds

# Use kind/port-forwards to create local ports for the UI (6060), API (7070) and Keycloak (8080). These ports will always
# log in the foreground, so perform this command in a separate window/terminal.
.PHONY: kind/port-forwards
kind/port-forwards:
	export KUBECONFIG="$$(realpath ./kubeconfig.kind.$(CI_BUILD_TAG))" \
		&& cd lagoon-charts.kind.lagoon \
		&& $(MAKE) port-forwards

# kind/retest re-runs tests in the local cluster. It preserves the last build
# lagoon core & remote setup, reducing rebuild time.
.PHONY: kind/retest
kind/retest:
	export KUBECONFIG="$$(pwd)/kubeconfig.kind.$(CI_BUILD_TAG)" \
		&& export IMAGE_REGISTRY="registry.$$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& cd lagoon-charts.kind.lagoon \
		&& $(MAKE) fill-test-ci-values TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY \
			SKIP_ALL_DEPS=true \
			LAGOON_FEATURE_FLAG_DEFAULT_ISOLATION_NETWORK_POLICY=enabled \
			USE_CALICO_CNI=true \
			LAGOON_FEATURE_FLAG_DEFAULT_ROOTLESS_WORKLOAD=enabled \
		&& docker run --rm --network host --name ct-$(CI_BUILD_TAG) \
			--volume "$$(pwd)/test-suite-run.ct.yaml:/etc/ct/ct.yaml" \
			--volume "$$(pwd):/workdir" \
			--volume "$$(realpath ../kubeconfig.kind.$(CI_BUILD_TAG)):/root/.kube/config" \
			--workdir /workdir \
			"quay.io/helmpack/chart-testing:$(CHART_TESTING_VERSION)" \
			ct install

.PHONY: kind/clean
kind/clean: local-dev/kind
	KIND_CLUSTER_NAME="$(CI_BUILD_TAG)" ./local-dev/kind delete cluster
ifeq ($(ARCH), darwin)
	docker rm --force $(CI_BUILD_TAG)-kind-proxy-32080
endif
