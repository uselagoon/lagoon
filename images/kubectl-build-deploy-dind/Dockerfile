ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/kubectl

ENV LAGOON=kubectl-build-deploy-dind

RUN mkdir -p /kubectl-build-deploy/git
RUN mkdir -p /kubectl-build-deploy/lagoon

WORKDIR /kubectl-build-deploy/git

COPY docker-entrypoint.sh /lagoon/entrypoints/100-docker-entrypoint.sh
COPY build-deploy.sh /kubectl-build-deploy/build-deploy.sh
COPY build-deploy-docker-compose.sh /kubectl-build-deploy/build-deploy-docker-compose.sh
COPY rootless.values.yaml /kubectl-build-deploy/rootless.values.yaml

COPY scripts /kubectl-build-deploy/scripts

COPY helmcharts  /kubectl-build-deploy/helmcharts

ENV IMAGECACHE_REGISTRY=imagecache.amazeeio.cloud

ENV DBAAS_OPERATOR_HTTP=dbaas.lagoon.svc:5000

RUN curl -sSL https://github.com/uselagoon/lagoon-linter/releases/download/v0.7.0/lagoon-linter_0.7.0_linux_amd64.tar.gz \
    | tar -xz -C /usr/local/bin lagoon-linter

RUN curl -sSL https://github.com/uselagoon/build-deploy-tool/releases/download/v0.15.2/build-deploy-tool_0.15.2_linux_amd64.tar.gz \
    | tar -xz -C /usr/local/bin build-deploy-tool

RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin > /dev/null 2>&1
#curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin > /dev/null 2>&1

# enable running unprivileged
RUN fix-permissions /home && fix-permissions /kubectl-build-deploy

CMD ["/kubectl-build-deploy/build-deploy.sh"]
