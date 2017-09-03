

image_folder := docker-images
BUILDTAG := lagoon-local-dev
REPO :=
IMAGESUFFIX :=
docker_build = docker build $(2) --build-arg IMAGE_REPO=$(BUILDTAG) -t "$(BUILDTAG)/$(subst /,:,$(1))" -f $(image_folder)/$(1)/Dockerfile $(image_folder)/$(1)
docker_tag_push = docker tag $(BUILDTAG)/$(subst /,:,$(1)) $(REPO)/$(subst /,:,$(1))$(IMAGESUFFIX) && docker push $(REPO)/$(subst /,:,$(1))$(IMAGESUFFIX)

docker-compose_build = docker-compose build --build-arg IMAGE_REPO=$(BUILDTAG) $(1)

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


# Pull upstream centos Image
.PHONY: pull-centos7
pull-centos7:
		docker pull centos:centos7


# Building Base Images, without parallelism, best for debugging
.PHONY: build-single
build-single: $(images)

# Regular build with calling a submake that runs parallel
.PHONY: build
build:
		$(MAKE) build-single -j --no-print-directory || $(MAKE) --no-print-directory build-error

# Nicer error in case the parallel build fails
.PHONY: build-error
build-error:
		@echo "ERROR during parallel build, execute 'make build-single' to see which one failed"

# Define build for each defined image
.PHONY: $(images)
$(images):
#		Calling docker_build for the image name
		$(call docker_build,$@)


# Define new list of all images prefixed with '[tag-push]-' so we can reuse the list again
tag-push-images = $(foreach var,$(images),[tag-push]-$(var))

# tag and push all images
.PHONY: tag-push
tag-push: $(tag-push-images)

# tag and push of each image
.PHONY: $(tag-push-images)
$(tag-push-images):
#   Check first if REPO variable is defined
		$(call check_defined, REPO, Docker Repo to which to push to)
#   Calling docker_tag_push for image, but remove the prefix '[tag-push]-' first
		$(call docker_tag_push,$(subst [tag-push]-,,$@))

######
###### SERVICE IMAGES
######

lagoon-node-packages-builder: centos7-node-builder/8
		docker build --build-arg IMAGE_REPO=$(BUILDTAG) -t $(BUILDTAG)/$@ -f docker-images/lagoon-node-packages-builder/latest/Dockerfile .

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

# node services need the lagoon-node-packages-builder which includes shared node packages
auth-server logs2slack openshiftdeploy openshiftremove openshiftremove-resources rest2tasks webhook-handler webhooks2tasks: lagoon-node-packages-builder
auth-ssh: centos/7
hacky-rest2tasks-ui: centos7-node-builder/6 centos7-node/6
cli api: centos7-node-builder/8 centos7-node/8
local-hiera-watcher-pusher: centos/7

# Building Base Images, without parallelism, best for debugging
.PHONY: services-build-single
services-build-single: $(services)

# Regular build with calling a submake that runs parallel
.PHONY: services-build
services-build:
		$(MAKE) services-build-single -j5 --no-print-directory || $(MAKE) --no-print-directory services-build-error

# Nicer error in case the parallel build fails
.PHONY: services-build-error
services-build-error:
		@echo "ERROR during parallel docker-compose build, execute 'make services-build-single' to see which one failed"

# Define build for each defined image
.PHONY: $(services)
$(services):
#		Calling docker_build for the image name
		$(call docker-compose_build,$@)



images-cache-save:
		mkdir -p .cache
		for image in `docker image ls -q | uniq`; do \
 			docker save $$image > .cache/$$image.tar; \
		done

images-cache-load:
		if find .cache -mindepth 1 -print -quit | grep -q .; then \
			for image in .cache/*; do \
				docker load -i $$image ; \
			done \
		fi

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