ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/node-16-builder:${UPSTREAM_TAG:-latest}

RUN apk add --no-cache \
        libexecinfo-dev

COPY package.json yarn.lock .env.defaults tsconfig.json /app/
COPY node-packages /app/node-packages

# We need to copy all services, so we have all
# package.json files for workspaces, otherwise
# subdependencies won't be installed
COPY services/api/package.json /app/services/api/
COPY services/auth-server/package.json /app/services/auth-server/
COPY services/logs2email/package.json /app/services/logs2email/
COPY services/logs2microsoftteams/package.json /app/services/logs2microsoftteams/
COPY services/logs2rocketchat/package.json /app/services/logs2rocketchat/
COPY services/logs2slack/package.json /app/services/logs2slack/
COPY services/logs2s3/package.json /app/services/logs2s3/
COPY services/logs2webhook/package.json /app/services/logs2webhook/
COPY services/controllerhandler/package.json /app/services/controllerhandler/
COPY services/kubernetesbuilddeploy/package.json /app/services/kubernetesbuilddeploy/
COPY services/rest2tasks/package.json /app/services/rest2tasks/
COPY services/webhook-handler/package.json /app/services/webhook-handler/
COPY services/webhooks2tasks/package.json /app/services/webhooks2tasks/
COPY services/ui/package.json /app/services/ui/

RUN yarn install --frozen-lockfile

RUN cd /app/node-packages/commons && yarn build
