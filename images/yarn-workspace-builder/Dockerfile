ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/node-10-builder:${UPSTREAM_TAG:-latest}

RUN apk add --no-cache \
        libexecinfo-dev \
        python

COPY package.json yarn.lock .env.defaults tsconfig.json /app/
COPY node-packages /app/node-packages

# We need to copy all services, so we have all
# package.json files for workspaces, otherwise
# subdependencies won't be installed
COPY services/api/package.json /app/services/api/
COPY services/auth-server/package.json /app/services/auth-server/
COPY services/kubernetesbuilddeploy/package.json /app/services/kubernetesbuilddeploy/
COPY services/kubernetesbuilddeploymonitor/package.json /app/services/kubernetesbuilddeploymonitor/
COPY services/kubernetesdeployqueue/package.json /app/services/kubernetesdeployqueue/
COPY services/kubernetesjobs/package.json /app/services/kubernetesjobs/
COPY services/kubernetesjobsmonitor/package.json /app/services/kubernetesjobsmonitor/
COPY services/kubernetesmisc/package.json /app/services/kubernetesmisc/
COPY services/kubernetesremove/package.json /app/services/kubernetesremove/
COPY services/logs2email/package.json /app/services/logs2email/
COPY services/logs2microsoftteams/package.json /app/services/logs2microsoftteams/
COPY services/logs2rocketchat/package.json /app/services/logs2rocketchat/
COPY services/logs2slack/package.json /app/services/logs2slack/
COPY services/openshiftbuilddeploy/package.json /app/services/openshiftbuilddeploy/
COPY services/openshiftbuilddeploymonitor/package.json /app/services/openshiftbuilddeploymonitor/
COPY services/openshiftjobs/package.json /app/services/openshiftjobs/
COPY services/openshiftjobsmonitor/package.json /app/services/openshiftjobsmonitor/
COPY services/openshiftmisc/package.json /app/services/openshiftmisc/
COPY services/openshiftremove/package.json /app/services/openshiftremove/
COPY services/controllerhandler/package.json /app/services/controllerhandler/
COPY services/webhook-handler/package.json /app/services/webhook-handler/
COPY services/webhooks2tasks/package.json /app/services/webhooks2tasks/
COPY services/ui/package.json /app/services/ui/

RUN yarn install --frozen-lockfile

RUN cd /app/node-packages/commons && yarn build
