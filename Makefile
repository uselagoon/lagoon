

image_folder := docker-images
IMAGESUFFIX := local
docker_build = docker build --cache-from amazeeiolagoon/$(subst /,:,$(1))  --cache-from amazeeiolagoon/$(subst /,:,$(1))-$(IMAGESUFFIX) -t amazeeiolagoon/$(subst /,:,$(1)) -f $(image_folder)/$(1)/Dockerfile
docker_build_folder = $(docker_build) $(image_folder)/$(1)
docker_build_root = $(docker_build) .

docker-builders_build = docker build --target builder --cache-from amazeeiolagoon/$(1)-builder:latest-$(IMAGESUFFIX) -t amazeeiolagoon/$(1)-builder:latest-$(IMAGESUFFIX) -f services/$(1)/Dockerfile
docker_builders_build_folder = $(docker-builders_build) services/$(1)
docker_builders_build_root = $(docker-builders_build) .

docker_push = docker push amazeeiolagoon/$(subst /,:,$(1))-$(IMAGESUFFIX) | cat
docker_tag_push = docker tag amazeeiolagoon/$(subst /,:,$(1)) amazeeiolagoon/$(subst /,:,$(1))-$(IMAGESUFFIX) && $(docker_push)

docker_pull = docker pull amazeeiolagoon/$(subst /,:,$(1))-$(IMAGESUFFIX) | cat || true

docker-compose_build = IMAGESUFFIX=$(IMAGESUFFIX) docker-compose build $(1) | cat
docker-compose_push = IMAGESUFFIX=$(IMAGESUFFIX) docker-compose push $(1) | cat

######
###### BASE IMAGES
######

# All Base Images

images := centos/7 \
					centos7-node/6 \
					centos7-node/8 \
					centos7-node-builder/6 \
					centos7-node-builder/8 \
					oc/latest \
					oc-build-deploy/latest

## Dependencies of Base Images
# centos7-node:6 Image needs centos:7 to be build first
centos7-node/6: centos/7
centos7-node-builder/6: centos7-node/6
centos7-node/8: centos/7
centos7-node-builder/8: centos7-node/8

oc-build-deploy/latest: oc/latest

images_root_context := lagoon-node-packages-builder/latest

# Pull upstream centos Image
.PHONY: pull-centos7
pull-centos7:
		docker pull centos:centos7


# Building Base Images, without parallelism, best for debugging
.PHONY: build-single
build-single: $(images) $(images_root_context)

# Regular build with calling a submake that runs parallel
.PHONY: build
build:
		$(MAKE) build-single -j --no-print-directory || $(MAKE) --no-print-directory build-error

# Nicer error in case the parallel build fails
.PHONY: build-error
build-error:
		@echo "ERROR during parallel build, execute 'make build-single' to see which one failed"
		@exit 1

# Define build for each defined image
.PHONY: $(images)
$(images):
#		Calling docker_build for the image name
		$(call docker_build_folder,$@)

# Define build for each defined image
.PHONY: $(images_root_context)
$(images_root_context):
#		Calling docker_build for the image name
		$(call docker_build_root,$@)

# Define new list of all images prefixed with '[tag-push]-' so we can reuse the list again
tag-push-images = $(foreach image,$(images) $(images_root_context),[tag-push]-$(image))

# tag and push all images
.PHONY: tag-push
tag-push: $(tag-push-images)

# tag and push of each image
.PHONY: $(tag-push-images)
$(tag-push-images):
#   Calling docker_tag_push for image, but remove the prefix '[tag-push]-' first
		$(call docker_tag_push,$(subst [tag-push]-,,$@))


# Define new list of all images prefixed with '[tag-push]-' so we can reuse the list again
pull-images = $(foreach image,$(images) $(images_root_context),[pull]-$(image))

# tag and push all images
.PHONY: pull-single
pull-single: $(pull-images)

# tag and push of each image
.PHONY: $(pull-images)
$(pull-images):
#   Calling docker_tag_push for image, but remove the prefix '[tag-push]-' first
		$(call docker_pull,$(subst [pull]-,,$@))


# Regular build with calling a submake that runs parallel
.PHONY: pull
pull:
		$(MAKE) pull-single -j5 --no-print-directory || $(MAKE) --no-print-directory pull-error

# Nicer error in case the parallel build fails
.PHONY: pull-error
pull-error:
		@echo "ERROR during parallel base image pull execute 'make pull-single' to see which one failed"
		@exit 1

######
###### SERVICE IMAGES
######

# Define service Images
services := webhook-handler \
						rabbitmq \
						openshiftremove \
						openshiftremove-resources \
						openshiftdeploy \
						logs2slack \
						webhooks2tasks \
						rest2tasks \
						api \
						auth-ssh \
						auth-server \
						jenkins \
						jenkins-slave \
						tests \
						git \
						hacky-rest2tasks-ui \
						local-hiera-watcher-pusher \
						cli


services-builders-folder := webhook-handler \
														openshiftremove \
														openshiftremove-resources \
														openshiftdeploy \
														logs2slack \
														webhooks2tasks \
														rest2tasks \
														auth-server

services-builders-folder-prefix = $(foreach image,$(services-builders-folder),[builder]-$(image))

services-builders-root := api \
													auth-ssh \
													hacky-rest2tasks-ui

services-builders-root-prefix = $(foreach image,$(services-builders-root),[builder]-$(image))

$(services-builders-folder-prefix):
		$(call docker_builders_build_folder,$(subst [builder]-,,$@))

$(services-builders-root-prefix):
		$(call docker_builders_build_root,$(subst [builder]-,,$@))

pull-services-builders-images = $(foreach image,$(services-builders-folder) $(services-builders-root),[builder-pull]-$(image))

bla: $(services-builders-root-prefix)

$(pull-services-builders-images):
		$(call docker_pull,$(subst [builder-pull]-,,lagoon-$@-builder:latest))


push-services-builders-images = $(foreach image,$(services-builders-folder) $(services-builders-root),[builder-push]-$(image))

$(push-services-builders-images):
		$(call docker_push,$(subst [builder-push]-,,lagoon-$@-builder:latest))

# node services need the lagoon-node-packages-builder which includes shared node packages
auth-server logs2slack openshiftdeploy openshiftremove openshiftremove-resources rest2tasks webhook-handler webhooks2tasks: lagoon-node-packages-builder/latest
auth-ssh: centos/7
hacky-rest2tasks-ui: centos7-node-builder/6 centos7-node/6
cli api: centos7-node-builder/8 centos7-node/8
local-hiera-watcher-pusher: centos/7

# Building Base Images, without parallelism, best for debugging
.PHONY: services-build-single
services-build-single: $(services) $(services-builders-folder-prefix) $(services-builders-root-prefix)

# Regular build with calling a submake that runs parallel
.PHONY: services-build
services-build:
		$(MAKE) services-build-single -j5 --no-print-directory || $(MAKE) --no-print-directory services-build-error

# Nicer error in case the parallel build fails
.PHONY: services-build-error
services-build-error:
		@echo "ERROR during parallel docker-compose build, execute 'make services-build-single' to see which one failed"
		@exit 1

# Define build for each defined image
.PHONY: $(services)
$(services):
#		Calling docker_build for the image name
		$(call docker-compose_build,$@)


# Define new list of all images prefixed with '[tag-push]-' so we can reuse the list again
push-services := $(foreach service,$(services),[push]-$(service))

# tag and push all images
.PHONY: push-services
push-services-single: $(push-services) $(push-services-builders-images)

# Regular build with calling a submake that runs parallel
.PHONY: push-services
push-services: 
		$(MAKE) push-services-single -j5 --no-print-directory || $(MAKE) --no-print-directory push-services-error

# Nicer error in case the parallel build fails
.PHONY: push-services-error
push-services-error:
		@echo "ERROR during pushing service images in parallel, execute 'make push-services-single' to see which one failed"
		@exit 1

# tag and push of each image
.PHONY: $(push-services)
$(push-services):
#   Calling docker_tag_push for image, but remove the prefix '[tag-push]-' first
		$(call docker-compose_push,$(subst [push]-,,$@))



pull-services: $(pull-services-builders-images)
		IMAGESUFFIX=$(IMAGESUFFIX) docker-compose pull --ignore-pull-failures --parallel | cat

images-cache-push: tag-push push-services

images-cache-pull: pull pull-services


######
###### Helper Functions
######

# Check that given variables are set and all have non-empty values,
# die with an error otherwise.
#
# Params:
#   1. Variable name(s) to test.
#   2. (optional) Error message to print.
check_defined = \
    $(strip $(foreach 1,$1, \
        $(call __check_defined,$1,$(strip $(value 2)))))
__check_defined = \
    $(if $(value $1),, \
      $(error Undefined $1$(if $2, ($2))))