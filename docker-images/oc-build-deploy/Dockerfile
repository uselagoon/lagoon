ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/oc

RUN apk add --no-cache bash git openssh docker py-pip && \
    pip install shyaml

RUN mkdir -p /git

WORKDIR /git

# Saving the upstream entrypoint in another file, so we can reuse it in our entrypoint
RUN cp /usr/sbin/container-entrypoint /usr/sbin/parent-container-entrypoint

COPY docker-entrypoint.sh /usr/sbin/docker-entrypoint
COPY git-checkout-pull.sh /usr/sbin/git-checkout-pull
COPY build-deploy.sh /usr/sbin/build-deploy
COPY exec-build.sh /usr/sbin/exec-build
COPY exec-openshift-resources.sh /usr/sbin/exec-openshift-resources
COPY exec-push.sh /usr/sbin/exec-push
COPY build-deploy-legacy.sh /usr/sbin/build-deploy-legacy
COPY openshift-templates /openshift-templates
COPY appuio.json /appuio/appuio.json

ENTRYPOINT ["docker-entrypoint"]

CMD build-deploy