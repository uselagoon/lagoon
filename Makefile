

TAG := local

DOCKER_BUILD_PARAMS :=

docker_build = docker build $(DOCKER_BUILD_PARAMS) --cache-from amazeeiolagoon/$(1)  --cache-from amazeeiolagoon/$(1):$(TAG) -t amazeeiolagoon/$(1) -f $(2) $(3)
docker_build_with_builder = docker build $(DOCKER_BUILD_PARAMS) --cache-from amazeeiolagoon/$(1)  --cache-from amazeeiolagoon/$(1):$(TAG) --cache-from amazeeiolagoon/$(1)-builder  --cache-from amazeeiolagoon/$(1)-builder:$(TAG) -t amazeeiolagoon/$(1) -f $(2) $(3)
docker_target_build = docker build $(DOCKER_BUILD_PARAMS) --target $(4) --cache-from amazeeiolagoon/$(1)  --cache-from amazeeiolagoon/$(1):$(IMAGESUFFIX) -t amazeeiolagoon/$(1) -f $(2) $(3)

# docker_build = @echo $(1) && sleep 2
# docker_build_with_builder = @echo $(1) && sleep 2
# docker_target_build = @echo $(1) && sleep 2

docker_tag_push = docker tag amazeeiolagoon/$(1) amazeeiolagoon/$(1):$(TAG) && docker push amazeeiolagoon/$(1):$(TAG) | cat

docker_pull = docker pull amazeeiolagoon/$(1):$(TAG) | cat || true

images := centos7 \
					centos7-node6 \
					centos7-node8 \
					centos7-node6-builder \
					centos7-node8-builder \
					oc \
					oc-build-deploy \
					yarn-workspace-builder \
					api \
					api-builder \
					auth-server \
					logs2slack \
					openshiftdeploy \
					openshiftremove \
					openshiftremove-resources \
					rest2tasks \
					webhook-handler \
					webhooks2tasks \
					auth-ssh \
					hacky-rest2tasks-ui \
					cli \
					local-hiera-watcher-pusher \
					local-git \
					jenkins \
					jenkins-slave \
					tests

build: $(images)

.PHONY: centos7
centos7:
	$(call docker_build,$@,images/$@/Dockerfile,images/$@)

.PHONY: centos7-node6
centos7-node6: centos7
	$(call docker_build,$@,images/$@/Dockerfile,images/$@)

.PHONY: centos7-node8
centos7-node8: centos7
	$(call docker_build,$@,images/$@/Dockerfile,images/$@)

.PHONY: centos7-node6-builder
centos7-node6-builder: centos7-node6
	$(call docker_build,$@,images/$@/Dockerfile,images/$@)

.PHONY: centos7-node8-builder
centos7-node8-builder: centos7-node8
	$(call docker_build,$@,images/$@/Dockerfile,images/$@)

.PHONY: oc
oc:
	$(call docker_build,$@,images/$@/Dockerfile,images/$@)

.PHONY: oc-build-deploy
oc-build-deploy: oc
	$(call docker_build,$@,images/$@/Dockerfile,images/$@)

.PHONY: yarn-workspace-builder
yarn-workspace-builder: centos7-node8-builder
	$(call docker_build,$@,images/$@/Dockerfile,.)

# Pull upstream centos Image
.PHONY: pull-centos7
pull-centos7:
		docker pull centos:centos7



.PHONY: api-builder
api-builder: centos7-node8-builder
	$(call docker_target_build,$@,services/api/Dockerfile,.,builder)

.PHONY: api
api: api-builder
	$(call docker_build_with_builder,$@,services/$@/Dockerfile,.)

.PHONY: auth-server
auth-server: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: logs2slack
logs2slack: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: openshiftdeploy
openshiftdeploy: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: openshiftremove
openshiftremove: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: openshiftremove-resources
openshiftremove-resources: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: rest2tasks
rest2tasks: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: webhook-handler
webhook-handler: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: webhooks2tasks
webhooks2tasks: yarn-workspace-builder
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: auth-ssh-builder
auth-ssh-builder: centos7
	$(call docker_target_build,$@,services/auth-ssh/Dockerfile,.,builder)

.PHONY: auth-ssh
auth-ssh: auth-ssh-builder
	$(call docker_build_with_builder,$@,services/$@/Dockerfile,.)

.PHONY: hacky-rest2tasks-ui
hacky-rest2tasks-ui: centos7-node6
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: cli
cli: centos7-node8
	$(call docker_build,$@,cli/Dockerfile,cli)

.PHONY: local-hiera-watcher-pusher
local-hiera-watcher-pusher: centos7
	$(call docker_build,$@,local-dev/hiera-watcher-pusher/Dockerfile,local-dev/hiera-watcher-pusher)

.PHONY: local-git
local-git: centos7
	$(call docker_build,$@,local-dev/git-server/Dockerfile,local-dev/git-server)

.PHONY: jenkins
jenkins:
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: jenkins-slave
jenkins-slave:
	$(call docker_build,$@,services/$@/Dockerfile,services/$@)

.PHONY: tests
tests:
	$(call docker_build,$@,$@/Dockerfile,$@)


# Define new list of all images prefixed with '[tag-push]-' so we can reuse the list again
tag-push-images = $(foreach image,$(images),[tag-push]-$(image))

# tag and push all images
.PHONY: tag-push
tag-push: $(tag-push-images)

# tag and push of each image
.PHONY: $(tag-push-images)
$(tag-push-images):
#   Calling docker_tag_push for image, but remove the prefix '[tag-push]-' first
		$(call docker_tag_push,$(subst [tag-push]-,,$@))


# Define new list of all images prefixed with '[pull]-' so we can reuse the list again
pull-images = $(foreach image,$(images),[pull]-$(image))

# tag and push all images
.PHONY: pull
pull: $(pull-images)

# pull definition for each image
.PHONY: $(pull-images)
$(pull-images):
#   Calling docker_tag_push for image, but remove the prefix '[pull]-' first
		$(call docker_pull,$(subst [pull]-,,$@))


publish-images := centos7 \
					centos7-node6 \
					centos7-node8 \
					centos7-node6-builder \
					centos7-node8-builder \
					oc \
					oc-build-deploy

