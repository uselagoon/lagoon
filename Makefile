

TAG := master

DOCKER_BUILD_PARAMS := --quiet

OC_VERSION := v3.6.0
OC_HASH := c4dd4cf

docker_build = docker build $(DOCKER_BUILD_PARAMS) --cache-from amazeeiolagoon/$(1)  --cache-from amazeeiolagoon/$(1):$(TAG) -t amazeeiolagoon/$(1) -f $(2) $(3)
docker_build_with_builder = docker build $(DOCKER_BUILD_PARAMS) --cache-from amazeeiolagoon/$(1)  --cache-from amazeeiolagoon/$(1):$(TAG) --cache-from amazeeiolagoon/$(1)-builder  --cache-from amazeeiolagoon/$(1)-builder:$(TAG) -t amazeeiolagoon/$(1) -f $(2) $(3)
docker_target_build = docker build $(DOCKER_BUILD_PARAMS) --target $(4) --cache-from amazeeiolagoon/$(1)  --cache-from amazeeiolagoon/$(1):$(TAG) -t amazeeiolagoon/$(1) -f $(2) $(3)

docker_tag_push = docker tag amazeeiolagoon/$(1) amazeeiolagoon/$(1):$(TAG) && docker push amazeeiolagoon/$(1):$(TAG) | cat

docker_publish = docker tag amazeeiolagoon/$(1) amazeeio/$(1) && docker push amazeeio/$(1) | cat

docker_pull = docker pull amazeeiolagoon/$(1):$(TAG) | cat || true

baseimages := centos7 \
							centos7-node6 \
							centos7-node8 \
							centos7-node6-builder \
							centos7-node8-builder \
							oc \
							oc-build-deploy

all-images += $(baseimages)

build-baseimages = $(foreach image,$(baseimages),build/$(image))

$(build-baseimages):
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),images/$(image)/Dockerfile,images/$(image))
	touch $@

build/centos7: images/centos7/Dockerfile
build/centos7-node6: build/centos7 images/centos7-node6/Dockerfile
build/centos7-node8: build/centos7 images/centos7-node8/Dockerfile
build/centos7-node6-builder: build/centos7-node6 images/centos7-node6/Dockerfile
build/centos7-node8-builder: build/centos7-node8 images/centos7-node8/Dockerfile
build/oc: images/oc/Dockerfile
build/oc-build-deploy: build/oc images/oc-build-deploy/Dockerfile

build/yarn-workspace-builder: build/centos7-node8-builder images/yarn-workspace-builder/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),images/$(image)/Dockerfile,.)
	touch $@

serviceimages :=  auth-server \
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

$(build-serviceimages):
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),services/$(image)/Dockerfile,services/$(image))
	touch $@

build/auth-server build/logs2slack build/openshiftdeploy build/openshiftremove build/openshiftremove-resources build/rest2tasks build/webhook-handler build/webhooks2tasks: build/yarn-workspace-builder

build/hacky-rest2tasks-ui: build/centos7-node6

all-images += api api-builder

build/api: build/api-builder
	$(eval image = $(subst build/,,$@))
	$(call docker_build_with_builder,$(image),services/$(image)/Dockerfile,services/$(image))
	touch $@
build/api-builder: build/centos7-node8-builder services/api/Dockerfile
	$(eval image = $(subst build/,,$@))
	$(call docker_target_build,$(image),services/api/Dockerfile,services/api,builder)
	touch $@

all-images += auth-ssh auth-ssh-builder

build/auth-ssh: build/auth-ssh-builder
	$(eval image = $(subst build/,,$@))
	$(call docker_build_with_builder,$(image),services/$(image)/Dockerfile,.)
	touch $@
build/auth-ssh-builder: build/centos7
	$(eval image = $(subst build/,,$@))
	$(call docker_target_build,$(image),services/auth-ssh/Dockerfile,.,builder)
	touch $@

all-images += cli

build/cli: build/centos7-node8
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	touch $@

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

all-images += tests

build/tests:
	$(eval image = $(subst build/,,$@))
	$(call docker_build,$(image),$(image)/Dockerfile,$(image))
	touch $@

.PHONY: build
build: $(foreach image,$(all-images),build/$(image))

# Define new list of all images prefixed with '[tag-push]-' so we can reuse the list again
tag-push-images = $(foreach image,$(all-images),[tag-push]-$(image))

# tag and push all images
.PHONY: tag-push
tag-push: $(tag-push-images)

# tag and push of each image
.PHONY: $(tag-push-images)
$(tag-push-images):
#   Calling docker_tag_push for image, but remove the prefix '[tag-push]-' first
		$(call docker_tag_push,$(subst [tag-push]-,,$@))


# Define new list of all images prefixed with '[pull]-' so we can reuse the list again
pull-images = $(foreach image,$(all-images),[pull]-$(image))

# tag and push all images
.PHONY: pull
pull: $(pull-images)

# pull definition for each image
.PHONY: $(pull-images)
$(pull-images):
#   Calling docker_tag_push for image, but remove the prefix '[pull]-' first
		$(call docker_pull,$(subst [pull]-,,$@))


all-tests-list:= 	ssh-auth \
									node \
									github \
									gitlab \
									rest \
									multisitegroup

all-tests = $(foreach image,$(all-tests-list),test/$(image))

.PHONY: tests
tests: $(all-tests)

deployment-test-services-main = rabbitmq openshiftremove openshiftdeploy logs2slack api jenkins jenkins-slave local-git local-hiera-watcher-pusher
deployment-test-services-rest = $(deployment-test-services-main) rest2tasks
deployment-test-services-webhooks = $(deployment-test-services-main) webhook-handler webhooks2tasks

.PHONY: test/ssh-auth
test/ssh-auth: build/auth-ssh build/auth-server build/api build/tests
		$(eval testname = $(subst test/,,$@))
		docker-compose -p lagoon up -d auth-ssh auth-server api
		docker-compose -p lagoon run --name tests-$(testname) --rm tests ansible-playbook /ansible/tests/$(testname).yaml

rest-tests = rest node multisitegroup
run-rest-tests = $(foreach image,$(rest-tests),test/$(image))

.PHONY: $(run-rest-tests)
$(run-rest-tests): build/centos7-node6-builder build/centos7-node8-builder $(foreach image,$(deployment-test-services-rest),build/$(image))
		$(eval testname = $(subst test/,,$@))
		docker-compose -p lagoon up -d $(deployment-test-services-rest)
		docker-compose -p lagoon run --name tests-$(testname) --rm tests ansible-playbook /ansible/tests/$(testname).yaml

webhook-tests = github gitlab
run-webhook-tests = $(foreach image,$(webhook-tests),test/$(image))

.PHONY: $(run-webhook-tests)
$(run-webhook-tests): build/centos7-node6-builder build/centos7-node8-builder $(foreach image,$(deployment-test-services-webhooks),build/$(image))
		$(eval testname = $(subst test/,,$@))
		docker-compose -p lagoon up -d $(deployment-test-services-webhooks)
		docker-compose -p lagoon run --name tests-$(testname) --rm tests ansible-playbook /ansible/tests/$(testname).yaml




publish-image-list := $(baseimages)
publish-images = $(foreach image,$(publish-image-list),[publish]-$(image))

# tag and push all images
.PHONY: publish
publish: $(publish-images)

# tag and push of each image
.PHONY: $(publish-images)
$(publish-images):
#   Calling docker_publish for image, but remove the prefix '[[publish]]-' first
		$(call docker_publish,$(subst [publish]-,,$@))


clean:
	rm -rf build/*

logs:
	docker-compose -p lagoon logs --tail=10 -f

up:
	docker-compose -p lagoon up -d

local-dev/oc/oc:
	@echo "downloading oc"
	@mkdir local-dev/oc
	@if [[ "`uname`" == "Darwin" ]]; then \
		curl -L -o oc-mac.zip https://github.com/openshift/origin/releases/download/$(OC_VERSION)/openshift-origin-client-tools-$(OC_VERSION)-$(OC_HASH)-mac.zip; \
		unzip -o oc-mac.zip -d local-dev/oc; \
		rm -f oc-mac.zip; \
	else \
		curl -L https://github.com/openshift/origin/releases/download/$(OC_VERSION)/openshift-origin-client-tools-$(OC_VERSION)-$(OC_HASH)-linux-64bit.tar.gz | tar xzC local-dev/oc --strip-components=1; \
	fi

start-openshift: local-dev/oc/oc oc-loopback
	./local-dev/oc/oc cluster up --routing-suffix=172.16.123.1.nip.io --public-hostname=172.16.123.1 --version="v1.5.1"

stop-openshift: local-dev/oc/oc
	./local-dev/oc/oc cluster down

clean-openshift:
	rm -rf ./local-dev/oc

oc-loopback:
	@echo "configuring loopback address for openshit, this might need sudo"
	@if [ "`uname`" == "Darwin" ]; then \
		sudo ifconfig lo0 alias 172.16.123.1; \
	else \
		sudo ifconfig lo:0 172.16.123.1 netmask 255.255.255.255 up; \
	fi
