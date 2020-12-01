ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/oc

# the oc image comes with an HOME=/home which is needed to run as unpriviledged, but oc-build-deploy-dind will run as root
RUN rm -rf /root && ln -s /home /root
ENV LAGOON=oc-build-deploy-dind

RUN	mkdir -p /oc-build-deploy/git
RUN	mkdir -p /oc-build-deploy/tug
RUN	mkdir -p /oc-build-deploy/lagoon

WORKDIR /oc-build-deploy/git

COPY docker-entrypoint.sh /lagoon/entrypoints/100-docker-entrypoint.sh
COPY build-deploy.sh /oc-build-deploy/build-deploy.sh
COPY build-deploy-docker-compose.sh /oc-build-deploy/build-deploy-docker-compose.sh
COPY tug.sh /oc-build-deploy/tug.sh

COPY tug /oc-build-deploy/tug
COPY scripts /oc-build-deploy/scripts

COPY openshift-templates  /oc-build-deploy/openshift-templates

ENV IMAGECACHE_REGISTRY=imagecache.amazeeio.cloud

CMD ["/oc-build-deploy/build-deploy.sh"]
