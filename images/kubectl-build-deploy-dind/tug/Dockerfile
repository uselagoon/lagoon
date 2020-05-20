ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/oc

ENV LAGOON=oc-build-deploy-tug

RUN mkdir -p /oc-build-deploy

# Copying already checked out git repo from oc-build-deploy-dind into tug
COPY . /oc-build-deploy

WORKDIR /oc-build-deploy/git


CMD ["/oc-build-deploy/tug.sh"]