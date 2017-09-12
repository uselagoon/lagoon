ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/oc

RUN apk add --no-cache bash git openssh docker py-pip && \
    pip install shyaml

RUN mkdir -p /git

WORKDIR /git

# Saving the upstream entrypoint in another file, so we can reuse it in our entrypoint
RUN cp /usr/sbin/container-entrypoint /usr/sbin/parent-container-entrypoint

COPY docker-entrypoint.sh /usr/sbin/docker-entrypoint
COPY build-deploy.sh /usr/sbin/build-deploy
COPY build-deploy-docker-compose.sh /build-deploy-docker-compose.sh

COPY scripts /scripts

COPY openshift-templates /openshift-templates
COPY appuio.json /appuio/appuio.json

ENTRYPOINT ["docker-entrypoint"]

CMD build-deploy