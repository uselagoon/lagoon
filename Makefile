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
# 2. Starts needed Lagoon services for the test via docker compose up
# 3. Executes the test
#
# Run `make tests-list` to see a list of all tests.

# make tests
# Runs all tests together. Can be executed with `-j2` for two parallel running tests

# make up
# Starts all Lagoon Services at once, usefull for local development or just to start all of them.

# make logs
# Shows logs of Lagoon Services (aka docker compose logs -f)

#######
####### Default Variables
#######

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
BUILD_DEPLOY_IMAGE_REPO = uselagoon/build-deploy-image
BUILD_DEPLOY_IMAGE_TAG ?= edge

# UI_IMAGE_REPO and UI_IMAGE_TAG are an easy way to override the UI image used
# only works for installations where INSTALL_STABLE_CORE=false
UI_IMAGE_REPO = uselagoon/ui
UI_IMAGE_TAG = main

# SSHPORTALAPI_IMAGE_REPO and SSHPORTALAPI_IMAGE_TAG are an easy way to override the ssh portal api image used in the local stack lagoon-core
# only works for installations where INSTALL_STABLE_CORE=false
# SSHPORTALAPI_IMAGE_REPO =
# SSHPORTALAPI_IMAGE_TAG =

# SSHTOKEN_IMAGE_REPO and SSHTOKEN_IMAGE_TAG are an easy way to override the ssh token image used in the local stack lagoon-core
# only works for installations where INSTALL_STABLE_CORE=false
# SSHTOKEN_IMAGE_REPO =
# SSHTOKEN_IMAGE_TAG =

# SSHPORTAL_IMAGE_REPO and SSHPORTAL_IMAGE_TAG are an easy way to override the ssh portal image used in the local stack lagoon-remote
# only works for installations where INSTALL_STABLE_REMOTE=false
# SSHPORTAL_IMAGE_REPO =
# SSHPORTAL_IMAGE_TAG =

# OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG and OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY
# set this to a particular build image if required, defaults to nothing to consume what the chart provides
OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG=
OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY=

# To build k3d with Calico instead of Flannel, set this to true. Note that the Calico install in lagoon-charts is always
# disabled for use with k3d, as the cluster needs it on creation.
USE_CALICO_CNI ?= false

# Local environment
ARCH := $(shell uname | tr '[:upper:]' '[:lower:]')
MACHINE := $(shell uname -m | tr '[:upper:]' '[:lower:]')
LAGOON_VERSION := $(shell git describe --tags --exact-match 2>/dev/null || echo development)
DOCKER_DRIVER := $(shell docker info -f '{{.Driver}}')

# Name of the Branch we are currently in
BRANCH_NAME := $(shell git rev-parse --abbrev-ref HEAD)
SAFE_BRANCH_NAME := $(shell echo $(BRANCH_NAME) | sed -E 's/[^[:alnum:]_.-]//g' | cut -c 1-128)

PUBLISH_PLATFORM_ARCH := linux/amd64,linux/arm64

# Skip image scanning by default to make building images substantially faster
SCAN_IMAGES := false

# Settings for the MKDocs serving
MKDOCS_IMAGE ?= ghcr.io/amazeeio/mkdocs-material
MKDOCS_SERVE_PORT ?= 8000

# Init the file that is used to hold the image tag cross-reference table
$(shell >build.txt)
$(shell >scan.txt)

ifeq ($(MACHINE), arm64)
	PLATFORM_ARCH ?= linux/arm64
else
	PLATFORM_ARCH ?= linux/amd64
endif

# this enables the ssh portal and other related services to be exposed on a LoadBalancer for local development usage
LAGOON_SSH_PORTAL_LOADBALANCER ?= true

HELM = $(realpath ./local-dev/helm)
KUBECTL = $(realpath ./local-dev/kubectl)
JQ = $(realpath ./local-dev/jq)
K3D = $(realpath ./local-dev/k3d)

# which database vendor type to use, can be mariadb (default) or mysql
DATABASE_VENDOR = mariadb
# DATABASE_VENDOR = mysql
DATABASE_DOCKERFILE = Dockerfile
ifeq ($(DATABASE_VENDOR), mysql)
DATABASE_DOCKERFILE = Dockerfile.mysql
endif

#######
####### Functions
#######

# Builds a docker image. Expects as arguments: name of the image, location of Dockerfile, path of
# Docker Build Context
docker_build = PLATFORMS=$(PLATFORM_ARCH) IMAGE_REPO=$(CI_BUILD_TAG) DATABASE_VENDOR=$(DATABASE_VENDOR) DATABASE_DOCKERFILE=$(DATABASE_DOCKERFILE) UPSTREAM_REPO=$(UPSTREAM_REPO) UPSTREAM_TAG=$(UPSTREAM_TAG) TAG=latest LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl --builder $(CI_BUILD_TAG) --load $(1)

docker_buildx_create = 	docker buildx create --name $(CI_BUILD_TAG) || echo  -e '$(CI_BUILD_TAG) builder already present\n'

scan_cmd = docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(HOME)/Library/Caches:/root/.cache/ aquasec/trivy --timeout 5m0s $(CI_BUILD_TAG)/$(1) >> scan.txt

ifeq ($(SCAN_IMAGES),true)
	scan_image = $(scan_cmd)
else
	scan_image =
endif

.PHONY: docker_pull
docker_pull:
	docker images --format "{{.Repository}}:{{.Tag}}" | grep -E '$(UPSTREAM_REPO)' | grep -E '$(UPSTREAM_TAG)' | xargs -tn1 -P8 docker pull -q || true;
	grep -Eh 'FROM' $$(find . -type f -name *Dockerfile) | grep -Ev '_REPO|_VERSION|_CACHE' | awk '{print $$2}' | sort --unique | xargs -tn1 -P8 docker pull -q


#######
####### Service Images
#######
####### Services Images are the Docker Images used to run the Lagoon Microservices, these images
####### will be expected by docker compose to exist.

# Yarn Workspace Image which builds the Yarn Workspace within a single image. This image will be
# used by all microservices based on Node.js to not build similar node packages again
build-images += yarn-workspace-builder
build/yarn-workspace-builder: yarn-workspace-builder/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_buildx_create)
	$(call docker_build,$(image),$(image)/Dockerfile,.)
	$(call scan_image,$(image),)

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
	$(call docker_buildx_create)
	$(call docker_build,task-$(image),taskimages/$(image)/Dockerfile,taskimages/$(image))
	$(call scan_image,task-$(image),)

# Variables of service images we manage and build
services :=	api \
			api-db \
			api-redis \
			auth-server \
			actions-handler \
			backup-handler \
			broker \
			api-sidecar-handler \
			keycloak \
			keycloak-db \
			logs2notifications \
			webhook-handler \
			webhooks2tasks

service-images += $(services)

build-services = $(foreach image,$(services),build/$(image))

# Recipe for all building service-images
$(build-services):
	$(eval image = $(subst build/,,$@))
	$(call docker_buildx_create)
	$(call docker_build,$(image),services/$(image)/Dockerfile,services/$(image))
	$(call scan_image,$(image),)

# Dependencies of Service Images
build/auth-server build/webhook-handler build/webhooks2tasks build/api: build/yarn-workspace-builder
build/api-db: services/api-db/$(DATABASE_DOCKERFILE)
build/api-redis: services/api-redis/Dockerfile
build/actions-handler: services/actions-handler/Dockerfile
build/backup-handler: services/backup-handler/Dockerfile
build/broker: services/broker/Dockerfile
build/api-sidecar-handler: services/api-sidecar-handler/Dockerfile
build/keycloak-db: services/keycloak-db/$(DATABASE_DOCKERFILE)
build/keycloak: services/keycloak/Dockerfile
build/logs2notifications: services/logs2notifications/Dockerfile
build/tests: tests/Dockerfile
# Auth SSH needs the context of the root folder, so we have it individually
build/ssh: services/ssh/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_buildx_create)
	$(call docker_build,$(image),services/$(image)/Dockerfile,.)
	$(call scan_image,$(image),)
service-images += ssh

build/local-git: local-dev/git/Dockerfile
build/local-api-data-watcher-pusher: local-dev/api-data-watcher-pusher/Dockerfile

# Images for local helpers that exist in another folder than the service images
localdevimages := local-git \
									local-api-data-watcher-pusher

service-images += $(localdevimages)
build-localdevimages = $(foreach image,$(localdevimages),build/$(image))

$(build-localdevimages):
	$(eval folder = $(subst build/local-,,$@))
	$(eval image = $(subst build/,,$@))
	$(call docker_buildx_create)
	$(call docker_build,$(image),local-dev/$(folder)/Dockerfile,local-dev/$(folder))
	$(call scan_image,$(image),)

# Image with ansible test
build/tests:
	$(eval image = $(subst build/,,$@))
	$(call docker_buildx_create)
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	$(call scan_image,$(image),)
service-images += tests

s3-images += $(service-images)

#######
####### Commands
#######
####### List of commands in our Makefile

# Builds all Images
.PHONY: build
build:
	$(call docker_buildx_create)
	$(call docker_build,default)

.PHONY: build-list
build-list:
	$(call docker_buildx_create)
	$(call docker_build,--print) | jq -r '.target | keys[] | "build/"+.'

.PHONY: build-ui-logs-development
build-ui-logs-development:
	$(call docker_buildx_create)
	$(call docker_build,ui-logs-development)

# Wait for Keycloak to be ready (before this no API calls will work)
.PHONY: wait-for-keycloak
wait-for-keycloak:
	@$(info Waiting for Keycloak to be ready....)
	@grep -m 1 "Config of Keycloak done." <(docker compose -p $(CI_BUILD_TAG) --compatibility logs -f keycloak 2>&1)
	@docker compose -p $(CI_BUILD_TAG) cp ./local-dev/k3d-seed-data/seed-users.sh keycloak:/tmp/seed-users.sh \
	&& docker compose -p $(CI_BUILD_TAG) exec -it keycloak bash '/tmp/seed-users.sh' \
	&& echo "You will be able to log in with these seed user email addresses and the passwords will be the same as the email address" \
	&& echo "eg. maintainer@example.com has the password maintainer@example.com" \
	&& echo "" \
	&& echo "If you want to create an example SSO identity provider and example user, run make compose/example-sso" \
	&& echo "If you want to configure simple webauthn browswer flow, run make compose/configure-webauthn" \
	&& echo ""

.PHONY: compose/example-sso
compose/example-sso:
	@docker compose -p $(CI_BUILD_TAG) cp ./local-dev/k3d-seed-data/seed-example-sso.sh keycloak:/tmp/seed-example-sso.sh \
	&& docker compose -p $(CI_BUILD_TAG) exec -it keycloak bash '/tmp/seed-example-sso.sh'

.PHONY: compose/configure-webauthn
compose/configure-webauthn:
	@docker compose -p $(CI_BUILD_TAG) cp ./local-dev/k3d-seed-data/configure-webauthn.sh keycloak:/tmp/configure-webauthn.sh \
	&& docker compose -p $(CI_BUILD_TAG) exec -it keycloak bash '/tmp/configure-webauthn.sh'

# Define a list of which Lagoon Services are needed for running any deployment testing
main-test-services = actions-handler broker api-sidecar-handler logs2notifications api api-db api-redis api-sidecar-handler keycloak keycloak-db ssh auth-server local-git local-api-data-watcher-pusher local-minio

# List of Lagoon Services needed for webhook endpoint testing
webhooks-test-services = webhook-handler webhooks2tasks backup-handler

# These targets are used as dependencies to bring up containers in the right order.
.PHONY: main-test-services-up
main-test-services-up: $(foreach image,$(main-test-services),build/$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) -f docker-compose.yaml -f docker-compose.local-dev.yaml --compatibility up -d $(main-test-services)
	$(MAKE) wait-for-keycloak

.PHONY: drupaltest-services-up
drupaltest-services-up: main-test-services-up $(foreach image,$(drupal-test-services),build/$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) -f docker-compose.yaml -f docker-compose.local-dev.yaml --compatibility up -d $(drupal-test-services)

.PHONY: webhooks-test-services-up
webhooks-test-services-up: main-test-services-up $(foreach image,$(webhooks-test-services),build/$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) -f docker-compose.yaml -f docker-compose.local-dev.yaml --compatibility up -d $(webhooks-test-services)

#######
####### Publishing Images
#######
####### All main&PR images are pushed to testlagoon repository
#######

.PHONY: publish-testlagoon-images
publish-testlagoon-images:
	PLATFORMS=$(PUBLISH_PLATFORM_ARCH) DATABASE_VENDOR=$(DATABASE_VENDOR) DATABASE_DOCKERFILE=$(DATABASE_DOCKERFILE) IMAGE_REPO=docker.io/testlagoon TAG=$(BRANCH_NAME) LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl --builder $(CI_BUILD_TAG) --push

# tag and push all images

.PHONY: publish-uselagoon-images
publish-uselagoon-images:
	PLATFORMS=$(PUBLISH_PLATFORM_ARCH) DATABASE_VENDOR=$(DATABASE_VENDOR) DATABASE_DOCKERFILE=$(DATABASE_DOCKERFILE) IMAGE_REPO=docker.io/uselagoon TAG=$(LAGOON_VERSION) LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl --builder $(CI_BUILD_TAG) --push
	PLATFORMS=$(PUBLISH_PLATFORM_ARCH) DATABASE_VENDOR=$(DATABASE_VENDOR) DATABASE_DOCKERFILE=$(DATABASE_DOCKERFILE) IMAGE_REPO=docker.io/uselagoon TAG=latest LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl --builder $(CI_BUILD_TAG) --push

.PHONY: clean
clean:
	rm -rf build/*
	echo -e "use 'make docker_buildx_clean' to remove semi-permanent builder image"

.PHONY: docker_buildx_clean
docker_buildx_clean:
	docker buildx rm $(CI_BUILD_TAG) || echo  -e 'no builder $(CI_BUILD_TAG) found'

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
	IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) --compatibility logs --tail=10 -f $(service)

# Start all Lagoon Services
up:
ifeq ($(ARCH), darwin)
	UI_IMAGE_TAG=$(UI_IMAGE_TAG) UI_IMAGE_REPO=$(UI_IMAGE_REPO) \
		IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) \
		-f docker-compose.yaml -f docker-compose.local-dev.yaml --compatibility up -d
else
	# once this docker issue is fixed we may be able to do away with this
	# linux-specific workaround: https://github.com/docker/cli/issues/2290
	KEYCLOAK_URL=$$(docker network inspect -f '{{(index .IPAM.Config 0).Gateway}}' bridge):8088 \
		UI_IMAGE_TAG=$(UI_IMAGE_TAG) UI_IMAGE_REPO=$(UI_IMAGE_REPO) \
		IMAGE_REPO=$(CI_BUILD_TAG) \
		docker compose -p $(CI_BUILD_TAG) -f docker-compose.yaml -f docker-compose.local-dev.yaml --compatibility up -d
endif
	$(MAKE) wait-for-keycloak

down:
	IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) --compatibility down -v --remove-orphans

# kill all containers containing the name "lagoon"
kill:
	docker ps --format "{{.Names}}" | grep lagoon | xargs -t -r -n1 docker rm -f -v

.PHONY: local-dev-yarn
local-dev-yarn:
	$(MAKE) local-dev-yarn-stop
	docker run --name local-dev-yarn -d -v ${PWD}:/app uselagoon/node-22-builder
	docker exec local-dev-yarn bash -c "yarn install --frozen-lockfile"
	docker exec local-dev-yarn bash -c "cd /app/node-packages/commons && yarn build"
	echo -e "use 'yarn workspace api add package@version' to update a package in workspace api"
	docker exec -it local-dev-yarn bash
	$(MAKE) local-dev-yarn-stop

.PHONY: local-dev-yarn-stop
local-dev-yarn-stop:
	docker stop local-dev-yarn || true
	docker rm local-dev-yarn || true

.PHONY: ui-development
ui-development: build-ui-logs-development
	UI_IMAGE_TAG=$(UI_IMAGE_TAG) UI_IMAGE_REPO=$(UI_IMAGE_REPO) \
		IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) \
		-f docker-compose.yaml -f docker-compose.local-dev.yaml --compatibility up -d api api-db api-sidecar-handler local-api-data-watcher-pusher ui keycloak keycloak-db broker api-redis
	$(MAKE) wait-for-keycloak

.PHONY: api-development
api-development: build-ui-logs-development
	UI_IMAGE_TAG=$(UI_IMAGE_TAG) UI_IMAGE_REPO=$(UI_IMAGE_REPO) \
		IMAGE_REPO=$(CI_BUILD_TAG) docker compose -p $(CI_BUILD_TAG) \
		-f docker-compose.yaml -f docker-compose.local-dev.yaml --compatibility up -d api api-db api-sidecar-handler local-api-data-watcher-pusher keycloak keycloak-db broker api-redis
	$(MAKE) wait-for-keycloak

.PHONY: ui-logs-development
ui-logs-development: build-ui-logs-development
	UI_IMAGE_TAG=$(UI_IMAGE_TAG) UI_IMAGE_REPO=$(UI_IMAGE_REPO) \
		IMAGE_REPO=$(CI_BUILD_TAG) COMPOSE_STACK_NAME=$(CI_BUILD_TAG) \
		ADDITIONAL_FLAGS="-f docker-compose.yaml -f docker-compose.local-dev.yaml" ADDITIONAL_SERVICES="ui" $(MAKE) compose-api-logs-development

.PHONY: api-logs-development
api-logs-development: build-ui-logs-development
	IMAGE_REPO=$(CI_BUILD_TAG) COMPOSE_STACK_NAME=$(CI_BUILD_TAG) \
		ADDITIONAL_FLAGS="-f docker-compose.yaml -f docker-compose.local-dev.yaml" ADDITIONAL_SERVICES="" $(MAKE) compose-api-logs-development

# compose-api-logs-development can be consumed by other repositories to start a local api
# supported make variable passthrough are
# IMAGE_REPO - the docker repostory to use (uselagoon, testlagoon, other)
# IMAGE_REPO_TAG - the tag to use for (main, pr-1234, vX.X.X, other) (each service also has a specific tag override, see the docker-compose.yaml file)
# COMPOSE_STACK_NAME - the name of the stack that will be started
# ADDITIONAL_SERVICES - a way to pass through additional services ("ui", "ui ssh", etc..)
.PHONY: compose-api-logs-development
compose-api-logs-development:
	docker compose -p $(COMPOSE_STACK_NAME) $(ADDITIONAL_FLAGS) \
		--compatibility up -d $(ADDITIONAL_SERVICES) api api-db api-sidecar-handler actions-handler \
		local-api-data-watcher-pusher keycloak keycloak-db broker api-redis logs2notifications local-minio mailhog
	$(MAKE) CI_BUILD_TAG=$(COMPOSE_STACK_NAME) wait-for-keycloak

## CI targets

KUBECTL_VERSION := v1.31.0
HELM_VERSION := v3.16.1
K3D_VERSION = v5.7.4
GOJQ_VERSION = v0.12.16
STERN_VERSION = v2.6.1
CHART_TESTING_VERSION = v3.11.0
K3D_IMAGE = docker.io/rancher/k3s:v1.31.1-k3s1
TESTS = [nginx,api,features-kubernetes,bulk-deployment,features-kubernetes-2,features-variables,active-standby-kubernetes,tasks,drush,python,gitlab,github,bitbucket,services]
CHARTS_TREEISH = sslip
CHARTS_REPOSITORY = https://github.com/uselagoon/lagoon-charts.git
#CHARTS_REPOSITORY = ../lagoon-charts
TASK_IMAGES = task-activestandby

# the following can be used to install stable versions of lagoon directly from chart versions
# rather than the bleeding edge from CHARTS_TREEISH
# these will not build or use built images from this repository, just what the charts provide
# this can be used to install a known version and then revert to test upgrading from a stable version
INSTALL_STABLE_CORE = false
INSTALL_STABLE_REMOTE = false
INSTALL_STABLE_BUILDDEPLOY = false
INSTALL_STABLE_LAGOON = false
ifeq ($(INSTALL_STABLE_LAGOON), true)
	INSTALL_STABLE_CORE = true
	INSTALL_STABLE_REMOTE = true
	INSTALL_STABLE_BUILDDEPLOY = true
endif
STABLE_CORE_CHART_APP_VERSION =
STABLE_CORE_CHART_VERSION =
STABLE_REMOTE_CHART_VERSION =
STABLE_STABLE_BUILDDEPLOY_CHART_VERSION =

# older versions of lagoon core allowed insecure connections via http during testing
# keycloak 26 has required secure connections unless on localhost, which this local stack does not use
# https://www.keycloak.org/docs/latest/upgrading/#a-secure-context-is-now-required
# this means that we have to enable connections between api/keycloak/ui with https
# a new `make k3d/generate-ca` exists to facilitate the creation of a CA certificate to be used for generating ingress certificates
# once created, the certificate will exist in `local-dev/certificates` and can be installed in your browsers trusted authorities if you wish
# or used with curl `--cacert/--capath` for example
LAGOON_CORE_USE_HTTPS = true

# install mailpit for lagoon local development
INSTALL_MAILPIT = true

# optionally install k8up for lagoon local development testing
INSTALL_K8UP = false
BUILD_DEPLOY_CONTROLLER_K8UP_VERSION = v2

# the following can be used to selectively leave out the installation of certain
# dbaas provider types
INSTALL_MARIADB_PROVIDER =
INSTALL_POSTGRES_PROVIDER =
INSTALL_MONGODB_PROVIDER =
INSTALL_DBAAS_PROVIDERS = true
ifeq ($(INSTALL_DBAAS_PROVIDERS), false)
	INSTALL_MARIADB_PROVIDER = false
	INSTALL_POSTGRES_PROVIDER = false
	INSTALL_MONGODB_PROVIDER = false
endif
# mongo currently doesn't work on arm based systems, so just disable the provider entirely for now
ifeq ($(ARCH), darwin)
	INSTALL_MONGODB_PROVIDER = false
endif
ifeq ($(MACHINE), arm64)
	INSTALL_MONGODB_PROVIDER = false
endif

INSTALL_UNAUTHENTICATED_REGISTRY = false
# harbor currently doesn't work on arm based systems, so install an unauthenticated registry instead
ifeq ($(ARCH), darwin)
	INSTALL_UNAUTHENTICATED_REGISTRY = true
endif
ifeq ($(MACHINE), arm64)
	INSTALL_UNAUTHENTICATED_REGISTRY = true
endif

# if this is a stable version of lagoon that is older than the release version that keycloak 26 is used in
# then use http connections
ifeq ($(INSTALL_STABLE_CORE),true)
ifeq (,$(subst ",,$(STABLE_CORE_CHART_APP_VERSION)))
	STABLE_CORE_CHART_APP_VERSION = $(shell $(HELM) search repo lagoon/lagoon-core -o json | $(JQ) -r '.[]|.app_version')
endif
	LAGOON_CORE_USE_HTTPS = $(shell if ! printf 'v2.23.0\n%s\n' "$(STABLE_CORE_CHART_APP_VERSION)" | sort -V -C; then echo false; else echo true; fi)
endif

# the name of the docker network to create
DOCKER_NETWORK = k3d

# Symlink the installed kubectl client if the correct version is already
# installed, otherwise downloads it.
.PHONY: local-dev/kubectl
local-dev/kubectl:
ifeq ($(KUBECTL_VERSION), $(shell kubectl version --client 2>/dev/null | grep Client | sed -E 's/Client Version: (v[0-9.]+).*/\1/'))
	$(info linking local kubectl version $(KUBECTL_VERSION))
	ln -sf $(shell command -v kubectl) ./local-dev/kubectl
else
ifneq ($(KUBECTL_VERSION), $(shell ./local-dev/kubectl version --client 2>/dev/null | grep Client | sed -E 's/Client Version: (v[0-9.]+).*/\1/'))
	$(info downloading kubectl version $(KUBECTL_VERSION) for $(ARCH))
	rm local-dev/kubectl || true
	curl -sSLo local-dev/kubectl https://storage.googleapis.com/kubernetes-release/release/$(KUBECTL_VERSION)/bin/$(ARCH)/amd64/kubectl
	chmod a+x local-dev/kubectl
endif
endif

# Symlink the installed helm client if the correct version is already
# installed, otherwise downloads it.
.PHONY: local-dev/helm
local-dev/helm:
ifeq ($(HELM_VERSION), $(shell helm version --short --client 2>/dev/null | sed -nE 's/(v[0-9.]+).*/\1/p'))
	$(info linking local helm version $(HELM_VERSION))
	ln -sf $(shell command -v helm) ./local-dev/helm
else
ifneq ($(HELM_VERSION), $(shell ./local-dev/helm version --short --client 2>/dev/null | sed -nE 's/(v[0-9.]+).*/\1/p'))
	$(info downloading helm version $(HELM_VERSION) for $(ARCH))
	rm local-dev/helm || true
	curl -sSL https://get.helm.sh/helm-$(HELM_VERSION)-$(ARCH)-amd64.tar.gz | tar -xzC local-dev --strip-components=1 $(ARCH)-amd64/helm
	chmod a+x local-dev/helm
endif
endif

# Symlink the installed k3d client if the correct version is already
# installed, otherwise downloads it.
.PHONY: local-dev/k3d
local-dev/k3d:
ifeq ($(K3D_VERSION), $(shell k3d version 2>/dev/null | sed -nE 's/k3d version (v[0-9.]+).*/\1/p'))
	$(info linking local k3d version $(K3D_VERSION))
	ln -sf $(shell command -v k3d) ./local-dev/k3d
else
ifneq ($(K3D_VERSION), $(shell ./local-dev/k3d version 2>/dev/null | sed -nE 's/k3d version (v[0-9.]+).*/\1/p'))
	$(info downloading k3d version $(K3D_VERSION) for $(ARCH))
	rm local-dev/k3d || true
	curl -sSLo local-dev/k3d https://github.com/k3d-io/k3d/releases/download/$(K3D_VERSION)/k3d-$(ARCH)-amd64
	chmod a+x local-dev/k3d
endif
endif

# Symlink the installed jq client if the correct version is already
# installed, otherwise downloads it.
.PHONY: local-dev/jq
local-dev/jq:
ifeq ($(GOJQ_VERSION), $(shell gojq -v 2>/dev/null | sed -nE 's/gojq ([0-9.]+).*/v\1/p'))
	$(info linking local gojq version $(GOJQ_VERSION))
	ln -sf $(shell command -v gojq) ./local-dev/jq
else
ifneq ($(GOJQ_VERSION), $(shell ./local-dev/jq -v 2>/dev/null | sed -nE 's/gojq ([0-9.]+).*/v\1/p'))
	$(info downloading gojq version $(GOJQ_VERSION) for $(ARCH))
	rm local-dev/jq || true
ifeq ($(ARCH), darwin)
	TMPDIR=$$(mktemp -d) \
		&& curl -sSL https://github.com/itchyny/gojq/releases/download/$(GOJQ_VERSION)/gojq_$(GOJQ_VERSION)_$(ARCH)_arm64.zip -o $$TMPDIR/gojq.zip \
		&& (cd $$TMPDIR && unzip gojq.zip) && cp $$TMPDIR/gojq_$(GOJQ_VERSION)_$(ARCH)_arm64/gojq ./local-dev/jq && rm -rf $$TMPDIR
else
	curl -sSL https://github.com/itchyny/gojq/releases/download/$(GOJQ_VERSION)/gojq_$(GOJQ_VERSION)_$(ARCH)_amd64.tar.gz | tar -xzC local-dev --strip-components=1 gojq_$(GOJQ_VERSION)_$(ARCH)_amd64/gojq
	mv ./local-dev/{go,}jq
endif
	chmod a+x local-dev/jq
endif
endif

# Symlink the installed stern client if the correct version is already
# installed, otherwise downloads it.
.PHONY: local-dev/stern
local-dev/stern:
ifeq ($(STERN_VERSION), $(shell stern --version 2>/dev/null | sed -nE 's/stern version //p'))
	$(info linking local stern version $(STERN_VERSION))
	ln -sf $(shell command -v stern) ./local-dev/stern
else
ifneq ($(STERN_VERSION), v$(shell ./local-dev/stern --version 2>/dev/null | sed -nE 's/stern version //p'))
	$(info downloading stern version $(STERN_VERSION) for $(ARCH))
	rm local-dev/stern || true
	curl -sSLo local-dev/stern https://github.com/derdanne/stern/releases/download/$(STERN_VERSION)/stern_$(ARCH)_amd64
	chmod a+x local-dev/stern
endif
endif

GO = $(realpath ./local-dev/go/bin/go)
GO_VERSION := 1.23.5

.PHONY: local-dev/go
local-dev/go:
ifeq ($(GO_VERSION), $(shell go version 2>/dev/null | sed -nE 's/go version go//p' | awk '{print $$1}'))
	$(info linking local go version $(GO_VERSION))
	mkdir -p local-dev/go/bin
	ln -sf $(shell command -v go) ./local-dev/go/bin/go
else
ifneq ($(GO_VERSION), $(shell ./local-dev/go/bin/go version 2>/dev/null | sed -nE 's/go version go//p' | awk '{print $$1}'))
	$(info downloading go version $(GO_VERSION) for $(ARCH))
	rm -rf local-dev/go || true
	mkdir -p local-dev/go
	TMPDIR=$$(mktemp -d) \
		&& curl -sSLo $$TMPDIR/go.tar.gz https://go.dev/dl/go$(GO_VERSION).$(ARCH)-amd64.tar.gz \
		&& (cd $$TMPDIR && tar -xz --strip-components=1 -f go.tar.gz) && cp -r $$TMPDIR/. ./local-dev/go && rm -rf $$TMPDIR
endif
endif

.PHONY: local-dev-tools
local-dev-tools: local-dev/k3d local-dev/jq local-dev/helm local-dev/kubectl local-dev/stern

.PHONY: helm/repos
helm/repos: local-dev/helm
	# install repo dependencies required by the charts
	$(HELM) repo add harbor https://helm.goharbor.io
	$(HELM) repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
	$(HELM) repo add stable https://charts.helm.sh/stable
	$(HELM) repo add bitnami https://charts.bitnami.com/bitnami
	$(HELM) repo add amazeeio https://amazeeio.github.io/charts/
	$(HELM) repo add lagoon https://uselagoon.github.io/lagoon-charts/
	$(HELM) repo add minio https://charts.min.io/
	$(HELM) repo add nats https://nats-io.github.io/k8s/helm/charts/
	$(HELM) repo add metallb https://metallb.github.io/metallb
	$(HELM) repo add jetstack https://charts.jetstack.io
	$(HELM) repo add jouve https://jouve.github.io/charts/
	$(HELM) repo add twuni https://helm.twun.io
	$(HELM) repo add k8up https://k8up-io.github.io/k8up
	$(HELM) repo add appuio https://charts.appuio.ch
	$(HELM) repo update

# stand up a k3d cluster configured appropriately for lagoon testing
.PHONY: k3d/cluster
k3d/cluster: local-dev/k3d local-dev/jq local-dev/helm local-dev/kubectl local-dev/stern
	$(K3D) cluster list | grep -q "$(CI_BUILD_TAG)" && exit; \
		docker network create $(DOCKER_NETWORK) || true \
		&& export KUBECONFIG=$$(mktemp) \
		K3DCONFIG=$$(mktemp ./k3dconfig.XXX) \
		&& LAGOON_K3D_CIDR_BLOCK=$$(docker network inspect $(DOCKER_NETWORK) | $(JQ) '. [0].IPAM.Config[0].Subnet' | tr -d '"') \
		&& export LAGOON_K3D_NETWORK=$$(echo $${LAGOON_K3D_CIDR_BLOCK%???} | awk -F'.' '{print $$1,$$2,$$3,240}' OFS='.') \
		&& chmod 644 $$KUBECONFIG \
		$$([ $(USE_CALICO_CNI) != true ] && envsubst < ./k3d.config.yaml.tpl > $$K3DCONFIG) \
		$$([ $(USE_CALICO_CNI) = true ] && envsubst < ./k3d-calico.config.yaml.tpl > $$K3DCONFIG) \
		$$([ $(USE_CALICO_CNI) = true ] && wget -N https://k3d.io/$(K3D_VERSION)/usage/advanced/calico.yaml) \
		&& $(K3D) cluster create $(CI_BUILD_TAG) --image $(K3D_IMAGE) --wait --timeout 120s --config=$$K3DCONFIG --kubeconfig-update-default --kubeconfig-switch-context \
		&& cp $$KUBECONFIG "kubeconfig.k3d.$(CI_BUILD_TAG)" \
		&& echo -e 'Interact with the cluster during the test run in Jenkins like so:\n' \
		&& echo "export KUBECONFIG=\$$(mktemp) && ssh $$NODE_NAME sudo cat $$KUBECONFIG > \$$KUBECONFIG && K3D_PORT=\$$(sed -nE 's/.+server:.+:([0-9]+)/\1/p' \$$KUBECONFIG) && ssh -fNL \$$K3D_PORT:127.0.0.1:\$$K3D_PORT $$NODE_NAME" \
		&& echo -e '\nOr running locally:\n' \
		&& echo -e 'export KUBECONFIG=$$($(K3D) kubeconfig write $(CI_BUILD_TAG))\n' \
		&& echo -e 'kubectl ...\n'
ifeq ($(ARCH), darwin)
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
	if ! ifconfig lo0 | grep $$($(KUBECTL) get nodes -o jsonpath='{.items[0].status.addresses[0].address}') -q; then sudo ifconfig lo0 alias $$($(KUBECTL) get nodes -o jsonpath='{.items[0].status.addresses[0].address}'); fi
	docker rm --force $(CI_BUILD_TAG)-k3d-proxy-32080 || true
	docker run -d --name $(CI_BUILD_TAG)-k3d-proxy-32080 \
      --publish 32080:32080 \
      --link k3d-$(CI_BUILD_TAG)-server-0:target --network $(DOCKER_NETWORK) \
      alpine/socat -dd \
      tcp-listen:32080,fork,reuseaddr tcp-connect:target:32080
endif

# run go tests

GO_SERVICES = services/backup-handler services/api-sidecar-handler services/logs2notifications services/actions-handler taskimages/activestandby
.PHONY: go/test
go/test: local-dev/go
	for service in $(GO_SERVICES); do \
		echo "test $$service" \
		&& cd "$$service" \
		&& $(GO) fmt ./... \
		&& $(GO) vet ./... \
		&& $(GO) mod tidy \
		&& $(GO) clean -testcache && $(GO) test -v ./... \
		&& cd ../..; \
	done

K3D_SERVICES = api api-db api-redis auth-server backup-handler actions-handler broker api-sidecar-handler keycloak keycloak-db logs2notifications webhook-handler webhooks2tasks local-api-data-watcher-pusher local-git ssh tests $(TASK_IMAGES)
K3D_TESTS = local-api-data-watcher-pusher local-git tests
K3D_TOOLS = k3d helm kubectl jq stern

# install lagoon charts and run lagoon test suites in a k3d cluster
.PHONY: k3d/test
k3d/test: k3d/setup k3d/install-lagoon k3d/retest

LOCAL_DEV_SERVICES = api auth-server actions-handler api-sidecar-handler logs2notifications webhook-handler webhooks2tasks

# install lagoon dependencies in a k3d cluster
.PHONY: k3d/setup
k3d/setup: k3d/cluster helm/repos $(addprefix local-dev/,$(K3D_TOOLS)) k3d/checkout-charts
	export KUBECONFIG="$$(realpath kubeconfig.k3d.$(CI_BUILD_TAG))" \
		&& cd lagoon-charts.k3d.lagoon \
		&& $(MAKE) install-lagoon-dependencies \
			INSTALL_UNAUTHENTICATED_REGISTRY=$(INSTALL_UNAUTHENTICATED_REGISTRY) \
			DOCKER_NETWORK=$(DOCKER_NETWORK) \
			JQ=$(JQ) HELM=$(HELM) KUBECTL=$(KUBECTL) \
			USE_CALICO_CNI=false \
		$$([ $(INSTALL_MAILPIT) ] && echo 'INSTALL_MAILPIT=$(INSTALL_MAILPIT)') \
		$$([ $(INSTALL_K8UP) ] && echo 'INSTALL_K8UP=$(INSTALL_K8UP)') \
		$$([ $(INSTALL_MARIADB_PROVIDER) ] && echo 'INSTALL_MARIADB_PROVIDER=$(INSTALL_MARIADB_PROVIDER)') \
		$$([ $(INSTALL_POSTGRES_PROVIDER) ] && echo 'INSTALL_POSTGRES_PROVIDER=$(INSTALL_POSTGRES_PROVIDER)') \
		$$([ $(INSTALL_MONGODB_PROVIDER) ] && echo 'INSTALL_MONGODB_PROVIDER=$(INSTALL_MONGODB_PROVIDER)')

# k3d/dev can only be run once a cluster is up and running (run k3d/test or k3d/local-stack first) - it doesn't rebuild the cluster at all
# just checks out the repository and rebuilds and pushes the built images
# into the image registry and reinstalls lagoon charts
.PHONY: k3d/dev
k3d/dev: k3d/checkout-charts k3d/install-lagoon
	@$(MAKE) k3d/get-lagoon-details

# this is used to checkout the chart repo/branch again if required. otherwise will use the symbolic link
# that is created for subsequent commands
# it will also copy the certs generated for this local k3d into the checked out charts repo for re-use by the charts installer
.PHONY: k3d/checkout-charts
k3d/checkout-charts: k3d/generate-ca
	export CHARTSDIR=$$(mktemp -d ./lagoon-charts.XXX) \
		&& ln -sfn "$$CHARTSDIR" lagoon-charts.k3d.lagoon \
		&& git clone $(CHARTS_REPOSITORY) "$$CHARTSDIR" \
		&& cd "$$CHARTSDIR" \
		&& git checkout $(CHARTS_TREEISH) \
		&& mkdir -p certs \
		&& cp ../local-dev/certificates/* certs/.


# this just installs lagoon-core, lagoon-remote, and lagoon-build-deploy
# doing this allows for lagoon to be installed with a known stable chart version with the INSTALL_STABLE_X overrides
# and then running just the install-lagoon target without the INSTALL_STABLE_X overrides to verify if an upgrade is likely to succeed
# this sets INSTALL_LAGOON_DEPENDENCIES=false so that the dependencies aren't installed again, allowing for this target to be run multiple time
# to install or upgrade lagoon
.PHONY: k3d/install-lagoon
k3d/install-lagoon:
ifneq ($(INSTALL_STABLE_CORE),true)
	$(MAKE) build
	export KUBECONFIG="$$(realpath kubeconfig.k3d.$(CI_BUILD_TAG))" \
		&& export IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
		&& $(MAKE) k3d/push-images JQ=$(JQ) HELM=$(HELM) KUBECTL=$(KUBECTL)
	docker pull $(UI_IMAGE_REPO):$(UI_IMAGE_TAG)
endif
	export KUBECONFIG="$$(realpath kubeconfig.k3d.$(CI_BUILD_TAG))" \
	&& export IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
	&& cd lagoon-charts.k3d.lagoon \
	&& $(MAKE) install-lagoon \
		INSTALL_UNAUTHENTICATED_REGISTRY=$(INSTALL_UNAUTHENTICATED_REGISTRY) \
		INSTALL_LAGOON_DEPENDENCIES=false DOCKER_NETWORK=$(DOCKER_NETWORK) \
		TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
		HELM=$(HELM) KUBECTL=$(KUBECTL) JQ=$(JQ) \
		UI_IMAGE_REPO=$(UI_IMAGE_REPO) UI_IMAGE_TAG=$(UI_IMAGE_TAG) \
		LAGOON_CORE_USE_HTTPS=$(LAGOON_CORE_USE_HTTPS) \
		SSHPORTALAPI_IMAGE_REPO=$(SSHPORTALAPI_IMAGE_REPO) SSHPORTALAPI_IMAGE_TAG=$(SSHPORTALAPI_IMAGE_TAG) \
		SSHTOKEN_IMAGE_REPO=$(SSHTOKEN_IMAGE_REPO) SSHTOKEN_IMAGE_TAG=$(SSHTOKEN_IMAGE_TAG) \
		SSHPORTAL_IMAGE_REPO=$(SSHPORTAL_IMAGE_REPO) SSHPORTAL_IMAGE_TAG=$(SSHPORTAL_IMAGE_TAG) \
		OVERRIDE_BUILD_DEPLOY_DIND_IMAGE="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library/build-deploy-image:$(BUILD_DEPLOY_IMAGE_TAG)" \
		$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG)') \
		$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY)') \
		OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library/task-activestandby:$(SAFE_BRANCH_NAME)" \
		IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
		SKIP_INSTALL_REGISTRY=true \
		CORE_DATABASE_VENDOR=$(DATABASE_VENDOR) \
		LAGOON_FEATURE_FLAG_DEFAULT_ISOLATION_NETWORK_POLICY=enabled \
		USE_CALICO_CNI=false \
		LAGOON_SSH_PORTAL_LOADBALANCER=$(LAGOON_SSH_PORTAL_LOADBALANCER) \
		LAGOON_FEATURE_FLAG_DEFAULT_ROOTLESS_WORKLOAD=enabled \
		$$([ $(INSTALL_STABLE_CORE) ] && echo 'INSTALL_STABLE_CORE=$(INSTALL_STABLE_CORE)') \
		$$([ $(INSTALL_STABLE_REMOTE) ] && echo 'INSTALL_STABLE_REMOTE=$(INSTALL_STABLE_REMOTE)') \
		$$([ $(INSTALL_STABLE_BUILDDEPLOY) ] && echo 'INSTALL_STABLE_BUILDDEPLOY=$(INSTALL_STABLE_BUILDDEPLOY)') \
		$$([ $(STABLE_CORE_CHART_VERSION) ] && echo 'STABLE_CORE_CHART_VERSION=$(STABLE_CORE_CHART_VERSION)') \
		$$([ $(STABLE_REMOTE_CHART_VERSION) ] && echo 'STABLE_REMOTE_CHART_VERSION=$(STABLE_REMOTE_CHART_VERSION)') \
		$$([ $(STABLE_BUILDDEPLOY_CHART_VERSION) ] && echo 'STABLE_BUILDDEPLOY_CHART_VERSION=$(STABLE_BUILDDEPLOY_CHART_VERSION)') \
		$$([ $(INSTALL_MAILPIT) ] && echo 'INSTALL_MAILPIT=$(INSTALL_MAILPIT)') \
		$$([ $(INSTALL_K8UP) ] && echo 'INSTALL_K8UP=$(INSTALL_K8UP)') \
		BUILD_DEPLOY_CONTROLLER_K8UP_VERSION=$(BUILD_DEPLOY_CONTROLLER_K8UP_VERSION) \
		$$([ $(INSTALL_MARIADB_PROVIDER) ] && echo 'INSTALL_MARIADB_PROVIDER=$(INSTALL_MARIADB_PROVIDER)') \
		$$([ $(INSTALL_POSTGRES_PROVIDER) ] && echo 'INSTALL_POSTGRES_PROVIDER=$(INSTALL_POSTGRES_PROVIDER)') \
		$$([ $(INSTALL_MONGODB_PROVIDER) ] && echo 'INSTALL_MONGODB_PROVIDER=$(INSTALL_MONGODB_PROVIDER)')
	$(MAKE) k3d/push-stable-build-image
ifneq ($(SKIP_DETAILS),true)
	$(MAKE) k3d/get-lagoon-details
endif

# k3d/stable-install-lagoon is the same as k3d/install-lagoon except that it starts it with the latest stable chart versions
.PHONY: k3d/stable-install-lagoon
k3d/stable-install-lagoon:
	$(MAKE) k3d/install-lagoon INSTALL_STABLE_LAGOON=true

# k3d/local-stack will deploy and seed a lagoon-core with a lagoon-remote and all basic services to get you going
# and will provide some initial seed data for a user to jump right in and start using lagoon
INSTALL_SEED_DATA = true
.PHONY: k3d/local-stack
k3d/local-stack: k3d/setup
	$(MAKE) k3d/install-lagoon SKIP_DETAILS=true
ifeq ($(INSTALL_SEED_DATA),true)
	$(MAKE) k3d/seed-data
endif
	$(MAKE) k3d/get-lagoon-details

# k3d/stable-local-stack is the same as k3d/local-stack except that it starts it with the latest stable chart versions
# a helper without having to remember to specify the stable option to the target
.PHONY: k3d/stable-local-stack
k3d/stable-local-stack:
	$(MAKE) k3d/local-stack INSTALL_STABLE_LAGOON=true

# k3d/local-dev-patch will build the services in LOCAL_DEV_SERVICES on your machine, and then use kubectl patch to mount the folders into Kubernetes
# the deployments should be restarted to trigger any updated code changes
# `kubectl rollout undo deployment` can be used to rollback a deployment to before the annotated patch
# ensure that the correct version of Node to build the services is set on your machine
.PHONY: k3d/local-dev-patch
k3d/local-dev-patch:
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
		export IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
		&& for image in $(LOCAL_DEV_SERVICES); do \
			echo "building $$image" \
			&& cd services/$$image && yarn install && yarn build && cd ../..; \
		done \
		&& for image in $(LOCAL_DEV_SERVICES); do \
			echo "patching lagoon-core-$$image" \
			&& $(KUBECTL) --namespace lagoon-core patch deployment lagoon-core-$$image --patch-file ./local-dev/kubectl-patches/$$image.yaml; \
		done

## Use local-dev-logging to deploy an Elasticsearch/Kibana cluster into docker compose and forward
## container logs to it
.PHONY: k3d/local-dev-logging
k3d/local-dev-logging:
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" \
		&& docker compose -f local-dev/odfe-docker-compose.yml -p odfe up -d \
		&& $(HELM) upgrade --install --create-namespace \
			--namespace lagoon-logs-concentrator \
			--wait --timeout 15m \
			--values ./local-dev/lagoon-logs-concentrator.values.yaml \
			lagoon-logs-concentrator \
			./lagoon-charts.k3d.lagoon/charts/lagoon-logs-concentrator \
		&& $(HELM) dependency update ./lagoon-charts.k3d.lagoon/charts/lagoon-logging \
		&& $(HELM) upgrade --install --create-namespace --namespace lagoon-logging \
			--wait --timeout 15m \
			--values ./local-dev/lagoon-logging.values.yaml \
			lagoon-logging \
			./lagoon-charts.k3d.lagoon/charts/lagoon-logging \
		&& echo -e '\n\nInteract with the OpenDistro cluster at http://0.0.0.0:5601 using the default `admin/admin` credentials\n' \
		&& echo -e 'You will need to create a default index at http://0.0.0.0:5601/app/management/kibana/indexPatterns/create \n' \
		&& echo -e 'with a default `container-logs-*` pattern'

# k3d/push-images pushes locally build images into the k3d cluster registry.
IMAGES = $(K3D_SERVICES) $(LOCAL_DEV_SERVICES) $(TASK_IMAGES)
.PHONY: k3d/push-images
k3d/push-images:
	@export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
		export IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
		&& docker login -u admin -p Harbor12345 $$IMAGE_REGISTRY \
		&& for image in $(IMAGES); do \
			docker tag $(CI_BUILD_TAG)/$$image $$IMAGE_REGISTRY/$$image:$(SAFE_BRANCH_NAME) \
			&& docker push $$IMAGE_REGISTRY/$$image:$(SAFE_BRANCH_NAME); \
		done

# retag a local built build image then push the to the k3d cluster registry.
.PHONY: k3d/push-local-build-image
k3d/push-local-build-image:
	@export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
		export IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
		&& docker login -u admin -p Harbor12345 $$IMAGE_REGISTRY \
		&& docker tag lagoon/build-deploy-image:local $$IMAGE_REGISTRY/build-deploy-image:$(BUILD_DEPLOY_IMAGE_TAG) \
		&& docker push $$IMAGE_REGISTRY/build-deploy-image:$(BUILD_DEPLOY_IMAGE_TAG)

# pull, retag, then push the stable version of the build image to the k3d cluster registry.
.PHONY: k3d/push-stable-build-image
k3d/push-stable-build-image:
	@export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
		export IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
		&& docker login -u admin -p Harbor12345 $$IMAGE_REGISTRY \
		&& docker pull $(BUILD_DEPLOY_IMAGE_REPO):$(BUILD_DEPLOY_IMAGE_TAG) \
		&& docker tag $(BUILD_DEPLOY_IMAGE_REPO):$(BUILD_DEPLOY_IMAGE_TAG) $$IMAGE_REGISTRY/build-deploy-image:$(BUILD_DEPLOY_IMAGE_TAG) \
		&& docker push $$IMAGE_REGISTRY/build-deploy-image:$(BUILD_DEPLOY_IMAGE_TAG)

# Use k3d/get-lagoon-details to retrieve information related to accessing the local k3d deployed lagoon and its services
.PHONY: k3d/get-lagoon-details
k3d/get-lagoon-details:
	@export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" && \
	echo "===========DETAILS=============" && \
	echo "Lagoon UI URL: $$([ $(LAGOON_CORE_USE_HTTPS) = true ] && echo "https" || echo "http")://lagoon-ui.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io" \
	&& echo "Lagoon API URL: $$([ $(LAGOON_CORE_USE_HTTPS) = true ] && echo "https" || echo "http")://lagoon-api.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/graphql" \
	&& echo "Lagoon API admin legacy token: $$(docker run \
		-e JWTSECRET="$$($(KUBECTL) get secret -n lagoon-core lagoon-core-secrets -o jsonpath="{.data.JWTSECRET}" | base64 --decode)" \
		-e JWTAUDIENCE=api.dev \
		-e JWTUSER=localadmin \
		uselagoon/tests \
		python3 /ansible/tasks/api/admin_token.py)" \
	&& echo "Lagoon webhook URL: http://lagoon-webhook.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io" \
	&& echo "SSH Core Service: lagoon-ssh.$$($(KUBECTL) -n lagoon-core get services lagoon-core-ssh -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io:$$($(KUBECTL) -n lagoon-core get services lagoon-core-ssh -o jsonpath='{.spec.ports[0].port}')" \
	&& echo "SSH Portal Service: lagoon-ssh-portal.$$($(KUBECTL) -n lagoon get services lagoon-remote-ssh-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io:$$($(KUBECTL) -n lagoon get services lagoon-remote-ssh-portal -o jsonpath='{.spec.ports[0].port}')" \
	&& echo "SSH Token Service: lagoon-token.$$($(KUBECTL) -n lagoon-core get services lagoon-core-ssh-token -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io:$$($(KUBECTL) -n lagoon-core get services lagoon-core-ssh-token -o jsonpath='{.spec.ports[0].port}')" \
	&& echo "Keycloak admin URL: $$([ $(LAGOON_CORE_USE_HTTPS) = true ] && echo "https" || echo "http")://lagoon-keycloak.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/auth" \
	&& echo "Keycloak admin password: $$($(KUBECTL) get secret -n lagoon-core lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_ADMIN_PASSWORD}" | base64 --decode)" \
	&& echo "MailPit (email catching service): http://mailpit.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io" \
	&& echo ""
ifeq ($(LAGOON_CORE_USE_HTTPS),true)
	@echo "==========IMPORTANT============" \
		&& echo "Access to the UI is only valid over HTTPS." \
		&& echo "You will need to accept the invalid certificates for the following services by visiting the URLS for each in your browser" \
		&& echo "* Lagoon UI, API, Keycloak" \
		&& echo "Alternatively import the generated certificate './local-dev/certificates/rootCA.pem' into trusted authorities for websites in your browser" \
		&& echo "If you have mkcert installed, you can use 'make install-ca' to install the generated certificate into your trust store."
endif
	@ echo "Run 'make k3d/get-lagoon-cli-details' to retreive the configuration command for the lagoon-cli" && \
		echo ""

# Use k3d/get-lagoon-details to retrieve information related to accessing the local k3d deployed lagoon and its services
.PHONY: k3d/get-lagoon-cli-details
k3d/get-lagoon-cli-details:
	@export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" && \
	echo "=========CLI DETAILS===========" && \
	echo "lagoon config add --lagoon local-k3d --graphql http://lagoon-api.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/graphql \\" \
	&& echo "--token $$(docker run \
		-e JWTSECRET="$$($(KUBECTL) get secret -n lagoon-core lagoon-core-secrets -o jsonpath="{.data.JWTSECRET}" | base64 --decode)" \
		-e JWTAUDIENCE=api.dev \
		-e JWTUSER=localadmin \
		uselagoon/tests \
		python3 /ansible/tasks/api/admin_token.py) \\" \
	&& echo "--hostname lagoon-token.$$($(KUBECTL) -n lagoon-core get services lagoon-core-ssh-token -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io \\" \
	&& echo "--port $$($(KUBECTL) -n lagoon-core get services lagoon-core-ssh-token -o jsonpath='{.spec.ports[0].port}')" \
	&& echo "" \
	&& echo "When interacting with this Lagoon via the lagoon-cli, you will need to add the flag '--lagoon local-k3d' to commands" \
	&& echo "or set it as the default using 'lagoon config default --lagoon local-k3d'"

# k3d/seed-data is a way to seed a lagoon-core deployed via k3d/setup.
# it is also called as part of k3d/local-stack though so should not need to be called directly.
.PHONY: k3d/seed-data
k3d/seed-data:
	@export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" && \
	export LAGOON_LEGACY_ADMIN=$$(docker run \
		-e JWTSECRET="$$($(KUBECTL) get secret -n lagoon-core lagoon-core-secrets -o jsonpath="{.data.JWTSECRET}" | base64 --decode)" \
		-e JWTAUDIENCE=api.dev \
		-e JWTUSER=localadmin \
		uselagoon/tests \
		python3 /ansible/tasks/api/admin_token.py) && \
	echo "Loading API seed data" && \
	export SSH_PORTAL_HOST="$$($(KUBECTL) -n lagoon get services lagoon-remote-ssh-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}')" && \
	export SSH_PORTAL_PORT="$$($(KUBECTL) -n lagoon get services lagoon-remote-ssh-portal -o jsonpath='{.spec.ports[0].port}')" && \
	export TOKEN="$$($(KUBECTL) -n lagoon get secret lagoon-remote-ssh-core-token -o json | $(JQ) -r '.data.token | @base64d')" && \
	export CONSOLE_URL="https://kubernetes.default.svc/" && \
	export ROUTER_PATTERN="\$${project}.\$${environment}.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')" && \
	export SEED_DATA=$$(if [ $(INSTALL_STABLE_CORE) = true ]; then \
		envsubst < <(curl -s https://raw.githubusercontent.com/uselagoon/lagoon/refs/tags/$(STABLE_CORE_CHART_APP_VERSION)/local-dev/k3d-seed-data/00-populate-kubernetes.gql) | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $$0} else {printf "\\n"$$0}}'; \
	else \
		envsubst < ./local-dev/k3d-seed-data/00-populate-kubernetes.gql | sed 's/"/\\"/g' | sed 's/\\n/\\\\n/g' | awk -F'\n' '{if(NR == 1) {printf $$0} else {printf "\\n"$$0}}'; \
	fi) && \
	export SEED_DATA_JSON="{\"query\": \"$$SEED_DATA\"}" && \
	curl -ks -XPOST -H 'Content-Type: application/json' -H "Authorization: bearer $${LAGOON_LEGACY_ADMIN}" "$$([ $(LAGOON_CORE_USE_HTTPS) = true ] && echo "https" || echo "http")://lagoon-api.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/graphql" -d "$$SEED_DATA_JSON" && \
	echo "Loading API seed users" && \
	if [ $(INSTALL_STABLE_CORE) = true ]; then \
		cat <(curl -s https://raw.githubusercontent.com/uselagoon/lagoon/refs/tags/$(STABLE_CORE_CHART_APP_VERSION)/local-dev/k3d-seed-data/seed-users.sh) \
			| $(KUBECTL) -n lagoon-core  exec -i $$($(KUBECTL) -n lagoon-core get pods \
			-l app.kubernetes.io/component=lagoon-core-keycloak -o json | $(JQ) -r '.items[0].metadata.name') -- sh -c "cat > /tmp/seed-users.sh"; \
	else \
		cat ./local-dev/k3d-seed-data/seed-users.sh \
			| $(KUBECTL) -n lagoon-core  exec -i $$($(KUBECTL) -n lagoon-core get pods \
			-l app.kubernetes.io/component=lagoon-core-keycloak -o json | $(JQ) -r '.items[0].metadata.name') -- sh -c "cat > /tmp/seed-users.sh"; \
	fi \
	&& $(KUBECTL) -n lagoon-core exec -it $$($(KUBECTL) -n lagoon-core get pods -l app.kubernetes.io/component=lagoon-core-keycloak -o json | $(JQ) -r '.items[0].metadata.name') -- bash '/tmp/seed-users.sh' \
	&& echo "You will be able to log in with these seed user email addresses and the passwords will be the same as the email address" \
	&& echo "eg. maintainer@example.com has the password maintainer@example.com" \
	&& echo "" \
	&& echo "If you want to create an example SSO identity provider and example user, run make k3d/example-sso" \
	&& echo "If you want to configure simple webauthn browswer flow, run make k3d/configure-webauthn" \
	&& echo ""

.PHONY: k3d/example-sso
k3d/example-sso:
	@export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" && \
	cat ./local-dev/k3d-seed-data/seed-example-sso.sh | $(KUBECTL) -n lagoon-core  exec -i $$($(KUBECTL) -n lagoon-core get pods -l app.kubernetes.io/component=lagoon-core-keycloak -o json | $(JQ) -r '.items[0].metadata.name') -- sh -c "cat > /tmp/seed-example-sso.sh" \
	&& $(KUBECTL) -n lagoon-core exec -it $$($(KUBECTL) -n lagoon-core get pods -l app.kubernetes.io/component=lagoon-core-keycloak -o json | $(JQ) -r '.items[0].metadata.name') -- bash '/tmp/seed-example-sso.sh'

.PHONY: k3d/configure-webauthn
k3d/configure-webauthn:
	@export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" && \
	cat ./local-dev/k3d-seed-data/configure-webauthn.sh | $(KUBECTL) -n lagoon-core  exec -i $$($(KUBECTL) -n lagoon-core get pods -l app.kubernetes.io/component=lagoon-core-keycloak -o json | $(JQ) -r '.items[0].metadata.name') -- sh -c "cat > /tmp/configure-webauthn.sh" \
	&& $(KUBECTL) -n lagoon-core exec -it $$($(KUBECTL) -n lagoon-core get pods -l app.kubernetes.io/component=lagoon-core-keycloak -o json | $(JQ) -r '.items[0].metadata.name') -- bash '/tmp/configure-webauthn.sh'

# Use k3d/port-forwards to create local ports for the UI (6060), API (7070) and Keycloak (8080). These ports will always
# log in the foreground, so perform this command in a separate window/terminal.
.PHONY: k3d/port-forwards
k3d/port-forwards:
	export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" \
		&& cd lagoon-charts.k3d.lagoon \
		&& $(MAKE) port-forwards

# k3d/retest re-runs tests in the local cluster. It preserves the last build
# lagoon core & remote setup, reducing rebuild time.
.PHONY: k3d/retest
k3d/retest:
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" \
		&& $(MAKE) build/local-git \
		&& $(MAKE) build/local-api-data-watcher-pusher \
		&& $(MAKE) build/tests \
		&& $(MAKE) k3d/push-images JQ=$(JQ) HELM=$(HELM) KUBECTL=$(KUBECTL) IMAGES="tests local-git local-api-data-watcher-pusher" \
		&& cd lagoon-charts.k3d.lagoon \
		&& export IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
		&& $(MAKE) fill-test-ci-values DOCKER_NETWORK=$(DOCKER_NETWORK) TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$(HELM) KUBECTL=$(KUBECTL) \
			JQ=$(JQ) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library/build-deploy-image:$(BUILD_DEPLOY_IMAGE_TAG)" \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library/task-activestandby:$(SAFE_BRANCH_NAME)" \
			IMAGE_REGISTRY="registry.$$($(KUBECTL) -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').sslip.io/library" \
			SKIP_ALL_DEPS=true \
			CORE_DATABASE_VENDOR=$(DATABASE_VENDOR) \
			LAGOON_FEATURE_FLAG_DEFAULT_ISOLATION_NETWORK_POLICY=enabled \
			USE_CALICO_CNI=false \
			LAGOON_SSH_PORTAL_LOADBALANCER=$(LAGOON_SSH_PORTAL_LOADBALANCER) \
			LAGOON_FEATURE_FLAG_DEFAULT_ROOTLESS_WORKLOAD=enabled \
		&& docker run --rm --network host --name ct-$(CI_BUILD_TAG) \
			--volume "$$(pwd)/test-suite-run.ct.yaml:/etc/ct/ct.yaml" \
			--volume "$$(pwd):/workdir" \
			--volume "$$(realpath ../kubeconfig.k3d.$(CI_BUILD_TAG)):/root/.kube/config" \
			--workdir /workdir \
			"quay.io/helmpack/chart-testing:$(CHART_TESTING_VERSION)" \
			ct install --helm-extra-args "--timeout 60m"

# k3d/generate-ca will generate a CA certificate that will be used to issue certificates within the local-stack
# this CA certificate can be loaded into a web browser so that certificates don't present warnings
.PHONY: k3d/generate-ca
k3d/generate-ca:
	@mkdir -p local-dev/certificates
	openssl x509 -enddate -noout -in local-dev/certificates/rootCA.pem > /dev/null 2>&1 || \
	(openssl genpkey -out local-dev/certificates/rootCA-key.pem -algorithm RSA -pkeyopt rsa_keygen_bits:3072 && \
	openssl req -x509 -new -nodes -key local-dev/certificates/rootCA-key.pem \
		-sha256 -days 3560 -out local-dev/certificates/rootCA.pem -addext keyUsage=critical,digitalSignature,keyEncipherment,keyCertSign \
		-subj '/CN=lagoon.test/O=lagoon.test/OU=lagoon.test')

.PHONY: k3d/regenerate-ca
k3d/regenerate-ca:
	@mkdir -p local-dev/certificates
	@rm local-dev/certificates/rootCA.pem || true && \
	rm local-dev/certificates/rootCA-key.pem || true && \
	$(MAKE) k3d/generate-ca

# will use mkcert if it is available
.PHONY: install-ca
install-ca:
ifeq ($(shell command -v mkcert > /dev/null && echo 1 || echo 0), 1)
	@export CAROOT=local-dev/certificates && \
	mkcert -install
else
	@echo "mkcert not installed, please install mkcert. See https://github.com/FiloSottile/mkcert#installation"
endif

# will use mkcert if it is available
.PHONY: uninstall-ca
uninstall-ca:
ifeq ($(shell command -v mkcert > /dev/null && echo 1 || echo 0), 1)
	@export CAROOT=local-dev/certificates && \
	mkcert -uninstall
else
	@echo "mkcert not installed, please install mkcert. See https://github.com/FiloSottile/mkcert#installation"
endif

.PHONY: k3d/clean
k3d/clean: local-dev/k3d
	$(K3D) cluster delete $(CI_BUILD_TAG)
ifeq ($(ARCH), darwin)
	docker rm --force $(CI_BUILD_TAG)-k3d-proxy-32080 || true
endif

# clean up any old charts to prevent bloating of old charts from running k3d stacks regularly
.PHONY: k3d/clean-charts
k3d/clean-charts:
	@for chart in $$(ls -1 | grep lagoon-charts | egrep -v "lagoon-charts.k3d|$$(ls -l | grep -o "lagoon-charts.k3d.lagoon.*" | awk '{print $$3}' | cut -c 3-)") ; do \
		echo removing chart directory $$chart ; \
		rm -rf $$chart ; \
	done

# clean up any old k3d kubeconfigs
.PHONY: k3d/clean-k3dconfigs
k3d/clean-k3dconfigs:
	@for kubeconfig in $$(ls -1 | grep k3dconfig) ; do \
		echo removing k3dconfig $$kubeconfig ; \
		rm $$kubeconfig ; \
	done

.PHONY: k3d/clean-all
k3d/clean-all: k3d/clean k3d/clean-k3dconfigs k3d/clean-charts

.PHONY: docs/serve
docs/serve:
	@echo "Starting container to serve documentation"
	@docker pull $(MKDOCS_IMAGE)
	@docker run --rm -it \
		-p 127.0.0.1:$(MKDOCS_SERVE_PORT):$(MKDOCS_SERVE_PORT) \
		-v ${PWD}:/docs \
		--entrypoint sh $(MKDOCS_IMAGE) \
		-c 'mkdocs serve -s --dev-addr=0.0.0.0:$(MKDOCS_SERVE_PORT) -f mkdocs.yml'
