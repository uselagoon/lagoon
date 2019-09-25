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
COPY services/openshiftbuilddeploy/package.json /app/services/openshiftbuilddeploy/
COPY services/openshiftbuilddeploymonitor/package.json /app/services/openshiftbuilddeploymonitor/
COPY services/openshiftremove/package.json /app/services/openshiftremove/
COPY services/rest2tasks/package.json /app/services/rest2tasks/
COPY services/webhook-handler/package.json /app/services/webhook-handler/
COPY services/webhooks2tasks/package.json /app/services/webhooks2tasks/
COPY services/ui/package.json /app/services/ui/
COPY cli/package.json /app/cli/

RUN yarn install --frozen-lockfile
