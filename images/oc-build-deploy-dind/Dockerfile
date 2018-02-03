ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/oc

# the oc image comes with an HOME=/home which is needed to run as unpriviledged, but oc-build-deploy-dind will run as root
ENV HOME=/root
ENV LAGOON=oc-build-deploy-dind

RUN	mkdir -p /git

WORKDIR /git

COPY docker-entrypoint.sh /lagoon/entrypoints/100-docker-entrypoint.sh
COPY build-deploy.sh /usr/sbin/build-deploy
COPY build-deploy-docker-compose.sh /build-deploy-docker-compose.sh

COPY scripts /scripts

COPY openshift-templates /openshift-templates

CMD ["build-deploy"]
