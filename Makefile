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
BUILD_DEPLOY_IMAGE_TAG ?= edge

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

# Clear all data from the API on a retest run, usually to clear up after a failure. Set false to preserve
CLEAR_API_DATA ?= true

# Init the file that is used to hold the image tag cross-reference table
$(shell >build.txt)
$(shell >scan.txt)

ifeq ($(MACHINE), arm64)
	PLATFORM_ARCH ?= linux/arm64
else
	PLATFORM_ARCH ?= linux/amd64
endif

#######
####### Functions
#######

# Builds a docker image. Expects as arguments: name of the image, location of Dockerfile, path of
# Docker Build Context
docker_build = PLATFORMS=$(PLATFORM_ARCH) IMAGE_REPO=$(CI_BUILD_TAG) UPSTREAM_REPO=$(UPSTREAM_REPO) UPSTREAM_TAG=$(UPSTREAM_TAG) TAG=latest LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl $(1) --builder $(CI_BUILD_TAG) --load

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
####### will be expected by docker-compose to exist.

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
			broker-single \
			keycloak \
			keycloak-db \
			logs2notifications \
			webhook-handler \
			webhooks2tasks \
			workflows

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
build/api-db: services/api-db/Dockerfile
build/api-redis: services/api-redis/Dockerfile
build/actions-handler: services/actions-handler/Dockerfile
build/backup-handler: services/backup-handler/Dockerfile
build/broker-single: services/broker/Dockerfile
build/broker: build/broker-single
build/keycloak-db: services/keycloak-db/Dockerfile
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
	PLATFORMS=$(PLATFORM_ARCH) IMAGE_REPO=$(CI_BUILD_TAG) TAG=latest LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl default --builder $(CI_BUILD_TAG) --load

.PHONY: build-list
build-list:
	$(call docker_buildx_create)
	PLATFORMS=$(PLATFORM_ARCH) IMAGE_REPO=$(CI_BUILD_TAG) TAG=latest LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake --builder $(CI_BUILD_TAG) --print | jq '.target[].tags[]'

.PHONY: build-ui-logs-development
build-ui-logs-development:
	$(call docker_buildx_create)
	PLATFORMS=$(PLATFORM_ARCH) IMAGE_REPO=$(CI_BUILD_TAG) TAG=latest LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl ui-logs-development --builder $(CI_BUILD_TAG) --load

# Wait for Keycloak to be ready (before this no API calls will work)
.PHONY: wait-for-keycloak
wait-for-keycloak:
	$(info Waiting for Keycloak to be ready....)
	grep -m 1 "Config of Keycloak done." <(docker-compose -p $(CI_BUILD_TAG) --compatibility logs -f keycloak 2>&1)

# Define a list of which Lagoon Services are needed for running any deployment testing
main-test-services = actions-handler broker logs2notifications api api-db api-redis keycloak keycloak-db ssh auth-server local-git local-api-data-watcher-pusher local-minio

# List of Lagoon Services needed for webhook endpoint testing
webhooks-test-services = webhook-handler webhooks2tasks backup-handler

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

.PHONY: publish-testlagoon-images
publish-testlagoon-images:
	PLATFORMS=$(PUBLISH_PLATFORM_ARCH) IMAGE_REPO=docker.io/testlagoon TAG=$(BRANCH_NAME) LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl --builder $(CI_BUILD_TAG) --push

# tag and push all images

.PHONY: publish-uselagoon-images
publish-uselagoon-images:
	PLATFORMS=$(PUBLISH_PLATFORM_ARCH) IMAGE_REPO=docker.io/uselagoon TAG=$(LAGOON_VERSION) LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl --builder $(CI_BUILD_TAG) --push
	PLATFORMS=$(PUBLISH_PLATFORM_ARCH) IMAGE_REPO=docker.io/uselagoon TAG=latest LAGOON_VERSION=$(LAGOON_VERSION) docker buildx bake -f docker-bake.hcl --builder $(CI_BUILD_TAG) --push

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
ui-development: build-ui-logs-development
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d api api-db local-api-data-watcher-pusher ui keycloak keycloak-db broker api-redis

.PHONY: api-development
api-development: build-ui-logs-development
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d api api-db local-api-data-watcher-pusher keycloak keycloak-db broker api-redis

.PHONY: ui-logs-development
ui-logs-development: build-ui-logs-development
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) --compatibility up -d api api-db actions-handler local-api-data-watcher-pusher ui keycloak keycloak-db broker api-redis logs2notifications local-minio mailhog

## CI targets

KUBECTL_VERSION := v1.27.3
HELM_VERSION := v3.13.1
K3D_VERSION = v5.6.0
GOJQ_VERSION = v0.12.13
STERN_VERSION = v2.6.1
CHART_TESTING_VERSION = v3.10.1
K3D_IMAGE = docker.io/rancher/k3s:v1.27.3-k3s1
TESTS = [nginx,api,features-kubernetes,bulk-deployment,features-kubernetes-2,features-variables,active-standby-kubernetes,tasks,drush,python,gitlab,github,bitbucket,services,workflows]
CHARTS_TREEISH = prerelease/lagoon_v217
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

local-dev/k3d:
ifeq ($(K3D_VERSION), $(shell k3d version 2>/dev/null | sed -nE 's/k3d version (v[0-9.]+).*/\1/p'))
	$(info linking local k3d version $(K3D_VERSION))
	ln -s $(shell command -v k3d) ./local-dev/k3d
else
	$(info downloading k3d version $(K3D_VERSION) for $(ARCH))
	curl -sSLo local-dev/k3d https://github.com/k3d-io/k3d/releases/download/$(K3D_VERSION)/k3d-$(ARCH)-amd64
	chmod a+x local-dev/k3d
endif

local-dev/jq:
ifeq ($(GOJQ_VERSION), $(shell jq -v 2>/dev/null | sed -nE 's/gojq ([0-9.]+).*/v\1/p'))
	$(info linking local jq version $(GOJQ_VERSION))
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
	$(info linking local stern version $(STERN_VERSION))
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

# stand up a k3d cluster configured appropriately for lagoon testing
.PHONY: k3d/cluster
k3d/cluster: local-dev/k3d
	./local-dev/k3d cluster list | grep -q "$(CI_BUILD_TAG)" && exit; \
		docker network create k3d || true \
		&& export KUBECONFIG=$$(mktemp) \
		K3DCONFIG=$$(mktemp ./k3dconfig.XXX) \
		K3D_NODE_IP=$$(docker run --rm --network k3d alpine ip -o addr show eth0 | sed -nE 's/.* ([0-9.]{7,})\/.*/\1/p') && \
		if [[ $(ARCH) == darwin ]]; then \
			K3D_NODE_IP=$$(echo $$K3D_NODE_IP | awk -F '.' '{$$4++;printf "%d.%d.%d.%d",$$1,$$2,$$3,$$4}'); \
		fi \
		&& chmod 644 $$KUBECONFIG \
		$$([ $(USE_CALICO_CNI) != true ] && envsubst < ./k3d.config.yaml.tpl > $$K3DCONFIG) \
		$$([ $(USE_CALICO_CNI) = true ] && envsubst < ./k3d-calico.config.yaml.tpl > $$K3DCONFIG) \
		$$([ $(USE_CALICO_CNI) = true ] && wget -N https://k3d.io/$(K3D_VERSION)/usage/advanced/calico.yaml) \
		&& ./local-dev/k3d cluster create $(CI_BUILD_TAG) --image $(K3D_IMAGE) --wait --timeout 120s --config=$$K3DCONFIG --kubeconfig-update-default --kubeconfig-switch-context \
		&& cp $$KUBECONFIG "kubeconfig.k3d.$(CI_BUILD_TAG)" \
		&& echo -e 'Interact with the cluster during the test run in Jenkins like so:\n' \
		&& echo "export KUBECONFIG=\$$(mktemp) && scp $$NODE_NAME:$$KUBECONFIG \$$KUBECONFIG && K3D_PORT=\$$(sed -nE 's/.+server:.+:([0-9]+)/\1/p' \$$KUBECONFIG) && ssh -fNL \$$K3D_PORT:127.0.0.1:\$$K3D_PORT $$NODE_NAME" \
		&& echo -e '\nOr running locally:\n' \
		&& echo -e 'export KUBECONFIG=$$(./local-dev/k3d kubeconfig write $(CI_BUILD_TAG))\n' \
		&& echo -e 'kubectl ...\n'
ifeq ($(ARCH), darwin)
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
	if ! ifconfig lo0 | grep $$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}') -q; then sudo ifconfig lo0 alias $$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}'); fi
	docker rm --force $(CI_BUILD_TAG)-k3d-proxy-32080 || true
	docker run -d --name $(CI_BUILD_TAG)-k3d-proxy-32080 \
      --publish 32080:32080 \
      --link k3d-$(CI_BUILD_TAG)-server-0:target --network k3d \
      alpine/socat -dd \
      tcp-listen:32080,fork,reuseaddr tcp-connect:target:32080
endif

K3D_SERVICES = api api-db api-redis auth-server actions-handler broker keycloak keycloak-db logs2notifications webhook-handler webhooks2tasks local-api-data-watcher-pusher local-git ssh tests workflows $(TASK_IMAGES)
K3D_TESTS = local-api-data-watcher-pusher local-git tests
K3D_TOOLS = k3d helm kubectl jq stern

# install lagoon charts and run lagoon test suites in a k3d cluster
.PHONY: k3d/test
k3d/test: k3d/cluster helm/repos $(addprefix local-dev/,$(K3D_TOOLS)) build
	export CHARTSDIR=$$(mktemp -d ./lagoon-charts.XXX) \
		&& ln -sfn "$$CHARTSDIR" lagoon-charts.k3d.lagoon \
		&& git clone https://github.com/uselagoon/lagoon-charts.git "$$CHARTSDIR" \
		&& cd "$$CHARTSDIR" \
		&& git checkout $(CHARTS_TREEISH) \
		&& export KUBECONFIG="$$(realpath ../kubeconfig.k3d.$(CI_BUILD_TAG))" \
		&& export IMAGE_REGISTRY="registry.$$(../local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& $(MAKE) install-registry HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) USE_CALICO_CNI=false \
		&& cd .. && $(MAKE) k3d/push-images && cd "$$CHARTSDIR" \
		&& $(MAKE) fill-test-ci-values TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG)') \
			$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY)') \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY \
			SKIP_INSTALL_REGISTRY=true \
			LAGOON_FEATURE_FLAG_DEFAULT_ISOLATION_NETWORK_POLICY=enabled \
			USE_CALICO_CNI=false \
			LAGOON_FEATURE_FLAG_DEFAULT_ROOTLESS_WORKLOAD=enabled \
		&& docker run --rm --network host --name ct-$(CI_BUILD_TAG) \
			--volume "$$(pwd)/test-suite-run.ct.yaml:/etc/ct/ct.yaml" \
			--volume "$$(pwd):/workdir" \
			--volume "$$(realpath ../kubeconfig.k3d.$(CI_BUILD_TAG)):/root/.kube/config" \
			--workdir /workdir \
			"quay.io/helmpack/chart-testing:$(CHART_TESTING_VERSION)" \
			ct install --helm-extra-args "--timeout 60m"

LOCAL_DEV_SERVICES = api auth-server actions-handler logs2notifications webhook-handler webhooks2tasks

# install lagoon charts in a Kind cluster
.PHONY: k3d/setup
k3d/setup: k3d/cluster helm/repos $(addprefix local-dev/,$(K3D_TOOLS)) build
	export CHARTSDIR=$$(mktemp -d ./lagoon-charts.XXX) \
		&& ln -sfn "$$CHARTSDIR" lagoon-charts.k3d.lagoon \
		&& git clone https://github.com/uselagoon/lagoon-charts.git "$$CHARTSDIR" \
		&& cd "$$CHARTSDIR" \
		&& git checkout $(CHARTS_TREEISH) \
		&& export KUBECONFIG="$$(realpath ../kubeconfig.k3d.$(CI_BUILD_TAG))" \
		&& export IMAGE_REGISTRY="registry.$$(../local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& $(MAKE) install-registry HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
		&& cd .. && $(MAKE) -j6 k3d/push-images && cd "$$CHARTSDIR" \
		&& $(MAKE) fill-test-ci-values TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG)') \
			$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY)') \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY

# k3d/local-dev-patch will build the services in LOCAL_DEV_SERVICES on your machine, and then use kubectl patch to mount the folders into Kubernetes
# the deployments should be restarted to trigger any updated code changes
# `kubectl rollout undo deployment` can be used to rollback a deployment to before the annotated patch
# ensure that the correct version of Node to build the services is set on your machine
.PHONY: k3d/local-dev-patch
k3d/local-dev-patch:
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
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
.PHONY: k3d/local-dev-logging
k3d/local-dev-logging:
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" \
		&& docker-compose -f local-dev/odfe-docker-compose.yml -p odfe up -d \
		&& ./local-dev/helm upgrade --install --create-namespace \
			--namespace lagoon-logs-concentrator \
			--wait --timeout 15m \
			--values ./local-dev/lagoon-logs-concentrator.values.yaml \
			lagoon-logs-concentrator \
			./lagoon-charts.k3d.lagoon/charts/lagoon-logs-concentrator \
		&& ./local-dev/helm dependency update ./lagoon-charts.k3d.lagoon/charts/lagoon-logging \
		&& ./local-dev/helm upgrade --install --create-namespace --namespace lagoon-logging \
			--wait --timeout 15m \
			--values ./local-dev/lagoon-logging.values.yaml \
			lagoon-logging \
			./lagoon-charts.k3d.lagoon/charts/lagoon-logging \
		&& echo -e '\n\nInteract with the OpenDistro cluster at http://0.0.0.0:5601 using the default `admin/admin` credentials\n' \
		&& echo -e 'You will need to create a default index at http://0.0.0.0:5601/app/management/kibana/indexPatterns/create \n' \
		&& echo -e 'with a default `container-logs-*` pattern'

# k3d/dev can only be run once a cluster is up and running (run k3d/test first) - it doesn't rebuild the cluster at all, just pushes the built images
# into the image registry and reinstalls the lagoon-core helm chart.
.PHONY: k3d/dev
k3d/dev: build
	export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" \
		&& export IMAGE_REGISTRY="registry.$$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& $(MAKE) k3d/push-images && cd lagoon-charts.k3d.lagoon \
		&& $(MAKE) install-lagoon-core IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGETAG)') \
			$$([ $(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY) ] && echo 'OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY=$(OVERRIDE_BUILD_DEPLOY_CONTROLLER_IMAGE_REPOSITORY)') \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY

# k3d/push-images pushes locally build images into the k3d cluster registry.
IMAGES = $(K3D_SERVICES) $(LOCAL_DEV_SERVICES) $(TASK_IMAGES)
.PHONY: k3d/push-images
k3d/push-images:
	export KUBECONFIG="$$(pwd)/kubeconfig.k3d.$(CI_BUILD_TAG)" && \
		export IMAGE_REGISTRY="registry.$$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& docker login -u admin -p Harbor12345 $$IMAGE_REGISTRY \
		&& for image in $(IMAGES); do \
			docker tag $(CI_BUILD_TAG)/$$image $$IMAGE_REGISTRY/$$image:$(SAFE_BRANCH_NAME) \
			&& docker push $$IMAGE_REGISTRY/$$image:$(SAFE_BRANCH_NAME); \
		done

# Use k3d/get-admin-creds to retrieve the admin JWT, Lagoon admin password, and the password for the lagoonadmin user.
# These credentials are re-created on every re-install of Lagoon Core.
.PHONY: k3d/get-admin-creds
k3d/get-admin-creds:
	export KUBECONFIG="$$(realpath ./kubeconfig.k3d.$(CI_BUILD_TAG))" \
		&& cd lagoon-charts.k3d.lagoon \
		&& $(MAKE) get-admin-creds

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
		&& export IMAGE_REGISTRY="registry.$$(./local-dev/kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}').nip.io:32080/library" \
		&& cd lagoon-charts.k3d.lagoon \
		&& $(MAKE) fill-test-ci-values TESTS=$(TESTS) IMAGE_TAG=$(SAFE_BRANCH_NAME) DISABLE_CORE_HARBOR=true \
			HELM=$$(realpath ../local-dev/helm) KUBECTL=$$(realpath ../local-dev/kubectl) \
			JQ=$$(realpath ../local-dev/jq) \
			OVERRIDE_BUILD_DEPLOY_DIND_IMAGE=uselagoon/build-deploy-image:${BUILD_DEPLOY_IMAGE_TAG} \
			OVERRIDE_ACTIVE_STANDBY_TASK_IMAGE=$$IMAGE_REGISTRY/task-activestandby:$(SAFE_BRANCH_NAME) \
			IMAGE_REGISTRY=$$IMAGE_REGISTRY \
			SKIP_ALL_DEPS=true \
			LAGOON_FEATURE_FLAG_DEFAULT_ISOLATION_NETWORK_POLICY=enabled \
			USE_CALICO_CNI=false \
			LAGOON_FEATURE_FLAG_DEFAULT_ROOTLESS_WORKLOAD=enabled \
			CLEAR_API_DATA=$(CLEAR_API_DATA) \
		&& docker run --rm --network host --name ct-$(CI_BUILD_TAG) \
			--volume "$$(pwd)/test-suite-run.ct.yaml:/etc/ct/ct.yaml" \
			--volume "$$(pwd):/workdir" \
			--volume "$$(realpath ../kubeconfig.k3d.$(CI_BUILD_TAG)):/root/.kube/config" \
			--workdir /workdir \
			"quay.io/helmpack/chart-testing:$(CHART_TESTING_VERSION)" \
			ct install --helm-extra-args "--timeout 60m"

.PHONY: k3d/clean
k3d/clean: local-dev/k3d
	./local-dev/k3d cluster delete $(CI_BUILD_TAG)
ifeq ($(ARCH), darwin)
	docker rm --force $(CI_BUILD_TAG)-k3d-proxy-32080 || true
endif
