ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/oc

RUN	mkdir -p /git

WORKDIR /git

COPY docker-entrypoint.sh /usr/sbin/docker-entrypoint
COPY build-deploy.sh /usr/sbin/build-deploy
COPY build-deploy-docker-compose.sh /build-deploy-docker-compose.sh

COPY scripts /scripts

COPY openshift-templates /openshift-templates

ENTRYPOINT ["docker-entrypoint"]

CMD ["build-deploy"]
