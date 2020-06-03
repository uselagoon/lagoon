ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/node:10-builder

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
COPY services/logs2rocketchat/package.json /app/services/logs2rocketchat/
COPY services/logs2slack/package.json /app/services/logs2slack/
COPY services/logs2email/package.json /app/services/logs2email/
COPY services/openshiftbuilddeploy/package.json /app/services/openshiftbuilddeploy/
COPY services/openshiftbuilddeploymonitor/package.json /app/services/openshiftbuilddeploymonitor/
COPY services/openshiftremove/package.json /app/services/openshiftremove/
COPY services/kubernetesbuilddeploy/package.json /app/services/kubernetesbuilddeploy/
COPY services/kubernetesdeployqueue/package.json /app/services/kubernetesdeployqueue/
COPY services/kubernetesbuilddeploymonitor/package.json /app/services/kubernetesbuilddeploymonitor/
COPY services/kubernetesjobs/package.json /app/services/kubernetesjobs/
COPY services/kubernetesjobsmonitor/package.json /app/services/kubernetesjobsmonitor/
COPY services/kubernetesmisc/package.json /app/services/kubernetesmisc/
COPY services/kubernetesremove/package.json /app/services/kubernetesremove/
COPY services/webhook-handler/package.json /app/services/webhook-handler/
COPY services/webhooks2tasks/package.json /app/services/webhooks2tasks/
COPY services/ui/package.json /app/services/ui/

RUN yarn install --frozen-lockfile
