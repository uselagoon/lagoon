SHELL := /bin/bash
# amazee.io lagoon Makefile The main purpose of this Makefile is to provide easier handling of
# building images and running tests It understands the relation of the different images (like
# nginx-drupal is based on nginx) and builds them in the correct order Also it knows which
# services in docker-compose.yml are depending on which base images or maybe even other service
# images
#
# The main commands are:
#
# make help           show a list of the main commands
# make build:all      build all images
# make build:list     list all the generated build targets
# make build:s3-save  save to s3
# make build:s3-load  load from s3
# make build:pull     pulls all the base images that lagoon builds on into the
#                     local docker cache, and generates pull-report.json
#                     containing the image names/tags and hashes of these base
#                     images.

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

.PHONY: help
help: ## Display this help section
	@awk 'BEGIN {FS = ": .*## "} /^[\\:\/a-zA-Z0-9_-]+: .*## / { sub(/\\/, ""); printf "\033[36m%-36s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

#######
####### Default Variables
#######

# Parameter for all `docker build` commands, can be overwritten by passing `DOCKER_BUILD_PARAMS=` via the `-e` option
DOCKER_BUILD_PARAMS := --quiet

# Version and Hash of the OpenShift cli that should be downloaded
MINISHIFT_VERSION := 1.34.1
OPENSHIFT_VERSION := v3.11.0

MINISHIFT_CPUS := 6
MINISHIFT_MEMORY := 8GB
MINISHIFT_DISK_SIZE := 30GB

# On CI systems like jenkins we need a way to run multiple testings at the same time. We expect the
# CI systems to define an Environment variable CI_BUILD_TAG which uniquely identifies each build.
# If it's not set we assume that we are running local and just call it lagoon.
CI_BUILD_TAG ?= lagoon

ARCH := $(shell uname | tr '[:upper:]' '[:lower:]')
LAGOON_VERSION := $(shell git describe --tags --exact-match 2>/dev/null || echo development)
# Name of the Branch we are currently in
BRANCH_NAME :=

#######
####### Commands
#######
####### List of commands in our Makefile

# Define list of all tests
all-tests-list:=	features \
									node \
									drupal \
									drupal-postgres \
									drupal-galera \
									github \
									gitlab \
									bitbucket \
									rest \
									nginx \
									elasticsearch
all-tests = $(foreach image,$(all-tests-list),tests/$(image))

.PHONY: tests
tests: $(all-tests) ## Run all tests

.PHONY: tests-list
tests-list: ## List all tests
	@for number in $(all-tests); do \
			echo $$number ; \
	done
#### Definition of tests

# Define a list of which Lagoon Services are needed for running any deployment testing
deployment-test-services-main = broker openshiftremove openshiftbuilddeploy openshiftbuilddeploymonitor logs2email logs2slack logs2rocketchat logs2microsoftteams api api-db keycloak keycloak-db ssh auth-server local-git local-api-data-watcher-pusher tests

# These targets are used as dependencies to bring up containers in the right order.
.PHONY: test-services-main
test-services-main:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-main)

.PHONY: test-services-rest
test-services-rest: test-services-main
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d rest2tasks

.PHONY: test-services-drupal
test-services-drupal: test-services-rest
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d drush-alias

.PHONY: test-services-webhooks
test-services-webhooks: test-services-main
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d webhook-handler webhooks2tasks

# All Tests that use REST endpoints
rest-tests = rest node features nginx elasticsearch
run-rest-tests = $(foreach image,$(rest-tests),tests/$(image))
# List of Lagoon Services needed for REST endpoint testing
deployment-test-services-rest = $(deployment-test-services-main) rest2tasks
.PHONY: $(run-rest-tests)
$(run-rest-tests): minishift build\:node-6-builder build\:node-8-builder build\:oc-build-deploy-dind build\:broker-single $(foreach image,$(deployment-test-services-rest),build\:$(image)) build\:push-minishift test-services-rest
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) run --rm tests ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)

.PHONY: tests/drupal tests/drupal-postgres tests/drupal-galera
tests/drupal tests/drupal-postgres tests/drupal-galera: minishift build\:varnish-drupal build\:solr-5.5-drupal build\:nginx-drupal build\:redis build\:php-5.6-cli-drupal build\:php-7.0-cli-drupal build\:php-7.1-cli-drupal build\:php-7.2-cli-drupal build\:php-7.3-cli-drupal build\:php-7.4-cli-drupal build\:api-db build\:postgres-drupal build\:mariadb-drupal build\:postgres-ckan build\:oc-build-deploy-dind $(foreach image,$(deployment-test-services-rest),build\:$(image)) build\:drush-alias build\:push-minishift test-services-drupal
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) run --rm tests ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)

# All tests that use Webhook endpoints
webhook-tests = github gitlab bitbucket
run-webhook-tests = $(foreach image,$(webhook-tests),tests/$(image))
# List of Lagoon Services needed for webhook endpoint testing
deployment-test-services-webhooks = $(deployment-test-services-main) webhook-handler webhooks2tasks
.PHONY: $(run-webhook-tests)
$(run-webhook-tests): minishift build\:node-6-builder build\:node-8-builder build\:oc-build-deploy-dind $(foreach image,$(deployment-test-services-webhooks),build\:$(image)) build\:push-minishift test-services-webhooks
		$(eval testname = $(subst tests/,,$@))
		IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) run --rm tests ansible-playbook /ansible/tests/$(testname).yaml $(testparameter)


end2end-all-tests = $(foreach image,$(all-tests-list),end2end-tests/$(image))

.PHONY: end2end-tests
end2end-tests: $(end2end-all-tests)

.PHONY: start-end2end-ansible
start-end2end-ansible: build\:tests
		docker-compose -f docker-compose.yaml -f docker-compose.end2end.yaml -p end2end up -d tests

$(end2end-all-tests): start-end2end-ansible
		$(eval testname = $(subst end2end-tests/,,$@))
		docker exec -i $$(docker-compose -f docker-compose.yaml -f docker-compose.end2end.yaml -p end2end ps -q tests) ansible-playbook /ansible/tests/$(testname).yaml

end2end-tests/clean:
		docker-compose -f docker-compose.yaml -f docker-compose.end2end.yaml -p end2end down -v

push-docker-host-image: minishift build\:docker-host minishift/login-docker-registry
	docker tag $(CI_BUILD_TAG)/docker-host $$(cat minishift):30000/lagoon/docker-host
	docker push $$(cat minishift):30000/lagoon/docker-host | cat

lagoon-kickstart: $(foreach image,$(deployment-test-services-rest),build\:$(image))
	IMAGE_REPO=$(CI_BUILD_TAG) CI=false docker-compose -p $(CI_BUILD_TAG) up -d $(deployment-test-services-rest)
	sleep 30
	curl -X POST http://localhost:5555/deploy -H 'content-type: application/json' -d '{ "projectName": "lagoon", "branchName": "master" }'
	make logs

logs: ## Show Lagoon service logs
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) logs --tail=10 -f $(service)

up: ## Start all Lagoon services
ifeq ($(ARCH), darwin)
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d
else
	# hack for linux to obtain the localhost IP
	# we don't have a docker host DNS until this PR is merged: https://github.com/moby/moby/pull/40007
	KEYCLOAK_URL=$$(docker network inspect -f '{{(index .IPAM.Config 0).Gateway}}' bridge):8088 \
		IMAGE_REPO=$(CI_BUILD_TAG) \
		docker-compose -p $(CI_BUILD_TAG) up -d
endif
	grep -m 1 ".opendistro_security index does not exist yet" <(docker-compose -p $(CI_BUILD_TAG) logs -f logs-db 2>&1)
	while ! docker exec "$$(docker-compose -p $(CI_BUILD_TAG) ps -q logs-db)" ./securityadmin_demo.sh; do sleep 5; done
	grep -m 1 "Config of Keycloak done." <(docker-compose -p $(CI_BUILD_TAG) logs -f keycloak 2>&1)

down:
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) down -v

kill: ## Kill all containers containing the name "lagoon"
	docker ps --format "{{.Names}}" | grep lagoon | xargs -t -r -n1 docker rm -f -v

.PHONY: openshift
openshift:
	$(info the openshift command has been renamed to minishift)

# Start Local OpenShift Cluster within a docker machine with a given name, also check if the IP
# that has been assigned to the machine is not the default one and then replace the IP in the yaml files with it
minishift: local-dev/minishift/minishift
	$(info starting minishift $(MINISHIFT_VERSION) with name $(CI_BUILD_TAG))
ifeq ($(ARCH), darwin)
	./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) start --host-only-cidr "192.168.42.1/24" --cpus $(MINISHIFT_CPUS) --memory $(MINISHIFT_MEMORY) --disk-size $(MINISHIFT_DISK_SIZE) --vm-driver virtualbox --openshift-version="$(OPENSHIFT_VERSION)"
else
	./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) start --cpus $(MINISHIFT_CPUS) --memory $(MINISHIFT_MEMORY) --disk-size $(MINISHIFT_DISK_SIZE) --openshift-version="$(OPENSHIFT_VERSION)"
endif
	./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) openshift component add service-catalog
ifeq ($(ARCH), darwin)
	@OPENSHIFT_MACHINE_IP=$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip); \
	echo "replacing IP in local-dev/api-data/01-populate-api-data.gql and docker-compose.yaml with the IP '$$OPENSHIFT_MACHINE_IP'"; \
	sed -i '' -e "s/192.168\.[0-9]\{1,3\}\.\([2-9]\|[0-9]\{2,3\}\)/$${OPENSHIFT_MACHINE_IP}/g" local-dev/api-data/01-populate-api-data.gql docker-compose.yaml;
else
	@OPENSHIFT_MACHINE_IP=$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip); \
	echo "replacing IP in local-dev/api-data/01-populate-api-data.gql and docker-compose.yaml with the IP '$$OPENSHIFT_MACHINE_IP'"; \
	sed -i "s/192.168\.[0-9]\{1,3\}\.\([2-9]\|[0-9]\{2,3\}\)/$${OPENSHIFT_MACHINE_IP}/g" local-dev/api-data/01-populate-api-data.gql docker-compose.yaml;
endif
	./local-dev/minishift/minishift ssh --  '/bin/sh -c "sudo sysctl -w vm.max_map_count=262144"'
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	oc login -u system:admin; \
	bash -c "echo '{\"apiVersion\":\"v1\",\"kind\":\"Service\",\"metadata\":{\"name\":\"docker-registry-external\"},\"spec\":{\"ports\":[{\"port\":5000,\"protocol\":\"TCP\",\"targetPort\":5000,\"nodePort\":30000}],\"selector\":{\"docker-registry\":\"default\"},\"sessionAffinity\":\"None\",\"type\":\"NodePort\"}}' | oc --context="myproject/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" create -n default -f -"; \
	oc --context="myproject/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" adm policy add-cluster-role-to-user cluster-admin system:anonymous; \
	oc --context="myproject/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" adm policy add-cluster-role-to-user cluster-admin developer;
	@echo "$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip)" > $@
	@echo "wait 60secs in order to give openshift time to setup it's registry"
	sleep 60
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	for i in {10..30}; do oc --context="myproject/$$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) ip | sed 's/\./-/g'):8443/system:admin" patch pv pv00$${i} -p '{"spec":{"storageClassName":"bulk"}}'; done;

.PHONY: minishift/start
minishift/start: minishift minishift/configure-lagoon-local push-docker-host-image ## Create and start local minishift cluster, and configure for Lagoon

.PHONY: minishift/login-docker-registry
minishift/login-docker-registry: minishift
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	oc login --insecure-skip-tls-verify -u developer -p developer $$(cat minishift):8443; \
	oc whoami -t | docker login --username developer --password-stdin $$(cat minishift):30000

# Configures an openshift to use with Lagoon
.PHONY: openshift-lagoon-setup
openshift-lagoon-setup:
# Only use the minishift provided oc if we don't have one yet (allows system engineers to use their own oc)
	if ! which oc; then eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); fi; \
	oc -n default set env dc/router -e ROUTER_LOG_LEVEL=info -e ROUTER_SYSLOG_ADDRESS=router-logs.lagoon.svc:5140; \
	oc new-project lagoon; \
	oc adm pod-network make-projects-global lagoon; \
	oc -n lagoon create serviceaccount openshiftbuilddeploy; \
	oc -n lagoon policy add-role-to-user admin -z openshiftbuilddeploy; \
	oc -n lagoon create -f openshift-setup/clusterrole-openshiftbuilddeploy.yaml; \
	oc -n lagoon adm policy add-cluster-role-to-user openshiftbuilddeploy -z openshiftbuilddeploy; \
	oc -n lagoon create -f openshift-setup/priorityclasses.yaml; \
	oc -n lagoon create -f openshift-setup/shared-resource-viewer.yaml; \
	oc -n lagoon create -f openshift-setup/policybinding.yaml | oc -n lagoon create -f openshift-setup/rolebinding.yaml; \
	oc -n lagoon create serviceaccount docker-host; \
	oc -n lagoon adm policy add-scc-to-user privileged -z docker-host; \
	oc -n lagoon policy add-role-to-user edit -z docker-host; \
	oc -n lagoon create serviceaccount logs-collector; \
	oc -n lagoon adm policy add-cluster-role-to-user cluster-reader -z logs-collector; \
	oc -n lagoon adm policy add-scc-to-user hostaccess -z logs-collector; \
	oc -n lagoon adm policy add-scc-to-user privileged -z logs-collector; \
	oc -n lagoon adm policy add-cluster-role-to-user daemonset-admin -z lagoon-deployer; \
	oc -n lagoon create serviceaccount lagoon-deployer; \
	oc -n lagoon policy add-role-to-user edit -z lagoon-deployer; \
	oc -n lagoon create -f openshift-setup/clusterrole-daemonset-admin.yaml; \
	oc -n lagoon adm policy add-cluster-role-to-user daemonset-admin -z lagoon-deployer; \
	bash -c "oc process -n lagoon -f services/docker-host/docker-host.yaml | oc -n lagoon apply -f -"; \
	echo -e "\n\nAll Setup, use this token as described in the Lagoon Install Documentation:" \
	oc -n lagoon serviceaccounts get-token openshiftbuilddeploy


# This calls the regular openshift-lagoon-setup first, which configures our minishift like we configure a real openshift for lagoon.
# It then overwrites the docker-host deploymentconfig and cronjobs to use our own just-built docker-host images.
.PHONY: minishift/configure-lagoon-local
minishift/configure-lagoon-local: minishift openshift-lagoon-setup
	eval $$(./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) oc-env); \
	bash -c "oc process -n lagoon -p SERVICE_IMAGE=172.30.1.1:5000/lagoon/docker-host:latest -p REPOSITORY_TO_UPDATE=lagoon -f services/docker-host/docker-host.yaml | oc -n lagoon apply -f -"; \
	oc -n default set env dc/router -e ROUTER_LOG_LEVEL=info -e ROUTER_SYSLOG_ADDRESS=192.168.42.1:5140;

.PHONY: minishift/stop
minishift/stop: local-dev/minishift/minishift ## Stop and remove local minishift cluster
	./local-dev/minishift/minishift --profile $(CI_BUILD_TAG) delete --force
	rm -f minishift

# Stop All MiniShifts
.PHONY: minishift/stopall
minishift/stopall: local-dev/minishift/minishift
	for profile in $$(./local-dev/minishift/minishift profile list | awk '{ print $$2 }'); do ./local-dev/minishift/minishift --profile $$profile delete --force; done
	rm -f minishift

.PHONY: minishift/clean
minishift/clean: minishift/stop ## Stop and remove local minishift cluster, and remove local client binary
	rm -rf ./local-dev/minishift/minishift

# Stop All Minishifts, remove downloaded minishift
.PHONY: openshift/cleanall
minishift/cleanall: minishift/stopall
	rm -rf ./local-dev/minishift/minishift

# Symlink the installed minishift client if the correct version is already
# installed, otherwise downloads it.
local-dev/minishift/minishift:
	@mkdir -p ./local-dev/minishift
ifeq ($(MINISHIFT_VERSION), $(shell minishift version | sed -E 's/^minishift v([0-9.]+).*/\1/'))
	$(info linking local minishift version $(MINISHIFT_VERSION))
	ln -s $(shell command -v minishift) ./local-dev/minishift/minishift
else
	$(info downloading minishift version $(MINISHIFT_VERSION) for $(ARCH))
	curl -L https://github.com/minishift/minishift/releases/download/v$(MINISHIFT_VERSION)/minishift-$(MINISHIFT_VERSION)-$(ARCH)-amd64.tgz | tar xzC local-dev/minishift --strip-components=1
endif

.PHONY: rebuild-push-oc-build-deploy-dind
rebuild-push-oc-build-deploy-dind: minishift/login-docker-registry build\:oc-build-deploy-dind
	docker tag $(CI_BUILD_TAG)/oc-build-deploy-dind $$(cat minishift):30000/lagoon/oc-build-deploy-dind && docker push $$(cat minishift):30000/lagoon/oc-build-deploy-dind

.PHONY: ui-development
ui-development: build\:api build\:api-db build\:local-api-data-watcher-pusher build\:ui build\:keycloak build\:keycloak-db
	IMAGE_REPO=$(CI_BUILD_TAG) docker-compose -p $(CI_BUILD_TAG) up -d api api-db local-api-data-watcher-pusher ui keycloak keycloak-db

#######
####### Container image build system
#######

DOCKERFILES = $(shell find images services local-dev cli tests -type f -name 'Dockerfile*')
DOCKERRULES = .docker.mk
PHP_VERSIONS := 5.6 7.0 7.1 7.2 7.3 7.4
NODE_VERSIONS := 6 8 9 10 12
PYTHON_VERSIONS := 2.7 3.7
SOLR_VERSIONS := 5.5 6.6 7.5
# IMPORTANT: only one of each minor version, as the images are tagged based on minor version
ELASTIC_VERSIONS := 7.1.1 7.2.1 7.3.2

# Build a docker image.
# $1: image name
# $2: Dockerfile path
# $3: docker build context directory
docker_build_cmd = docker build $(DOCKER_BUILD_PARAMS) --build-arg LAGOON_VERSION=$(LAGOON_VERSION) --build-arg IMAGE_REPO=$(CI_BUILD_TAG) -t $(CI_BUILD_TAG)/$(1) -f $(2) $(3)

# Build a docker image with a version build-arg.
# $1: image name
# $2: base image version
# $3: image tag
# $4: Dockerfile path
# $5: docker build context directory
docker_build_version_cmd = docker build $(DOCKER_BUILD_PARAMS) --build-arg LAGOON_VERSION=$(LAGOON_VERSION) --build-arg IMAGE_REPO=$(CI_BUILD_TAG) --build-arg BASE_VERSION=$(2) -t $(CI_BUILD_TAG)/$(1):$(3) -f $(4) $(5)

# Tag an image with the `amazeeio` repository and push it.
# $1: source image name:tag
# $2: target image name:tag
docker_publish_amazeeio = docker tag $(CI_BUILD_TAG)/$(1) amazeeio/$(2) && docker push amazeeio/$(2)

# Tag an image with the `amazeeiolagoon` repository and push it.
# $1: source image name:tag
# $2: target image name:tag
docker_publish_amazeeiolagoon = docker tag $(CI_BUILD_TAG)/$(1) amazeeiolagoon/$(2) && docker push amazeeiolagoon/$(2)

$(DOCKERRULES): $(DOCKERFILES) Makefile docker-build.awk docker-pull.awk
	@# generate build commands for all lagoon docker images
	@(grep '^FROM $${IMAGE_REPO:-.*}/' $(DOCKERFILES); \
		grep -L '^FROM $${IMAGE_REPO:-.*}/' $(DOCKERFILES)) | \
		./docker-build.awk \
		-v PHP_VERSIONS="$(PHP_VERSIONS)" \
		-v NODE_VERSIONS="$(NODE_VERSIONS)" \
		-v PYTHON_VERSIONS="$(PYTHON_VERSIONS)" \
		-v SOLR_VERSIONS="$(SOLR_VERSIONS)" \
		-v ELASTIC_VERSIONS="$(ELASTIC_VERSIONS)" \
		> $@
	@# generate pull commands for all images lagoon builds on
	@grep '^FROM ' $(DOCKERFILES) | \
		grep -v ':FROM $${IMAGE_REPO:-.*}/' | \
		./docker-pull.awk \
		-v PHP_VERSIONS="$(PHP_VERSIONS)" \
		-v NODE_VERSIONS="$(NODE_VERSIONS)" \
		-v PYTHON_VERSIONS="$(PYTHON_VERSIONS)" \
		-v SOLR_VERSIONS="$(SOLR_VERSIONS)" \
		-v ELASTIC_VERSIONS="$(ELASTIC_VERSIONS)" \
		>> $@

include $(DOCKERRULES)
